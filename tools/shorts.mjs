// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
//
// Calibrage de la détection des Shorts, sur de vraies données.
//
//   node tools/shorts.mjs
//
// La première sonde a montré que le seuil de durée seul classerait « Short » près de
// la moitié du flux. Ce script compare trois signaux sur un échantillon :
//
//   A. durée ≤ 180 s (règle actuelle) ;
//   B. format vertical, déduit des dimensions de l'iframe renvoyée par videos.list
//      avec part=player — gratuit, puisque le coût est par requête et non par partie ;
//   C. vérité terrain : youtube.com/shorts/<id> renvoie une redirection vers /watch
//      quand la vidéo n'est PAS un Short. Une requête HTTP par vidéo : trop coûteux
//      pour l'application, mais parfait comme étalon ici.
//
// On en déduit laquelle de A ou B se rapproche le plus de C.

import fs from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

const CLIENT_ID = process.env.SONDE_CLIENT_ID;
const CLIENT_SECRET = process.env.SONDE_CLIENT_SECRET;
const FICHIER_JETON = new URL('../.sonde.json', import.meta.url);
/** Taille de l'échantillon soumis à la vérité terrain (1 requête HTTP chacune). */
const ECHANTILLON = 120;

async function jetonAcces() {
  const { refresh_token } = JSON.parse(await fs.readFile(FICHIER_JETON, 'utf8'));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!r.ok) throw new Error('Lance d’abord « npm run sonde » pour autoriser le compte.');
  return (await r.json()).access_token;
}

async function api(chemin, parametres, jeton) {
  const url = `https://www.googleapis.com/youtube/v3/${chemin}?${new URLSearchParams(parametres)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${jeton}` } });
  if (!r.ok) throw new Error(`${chemin} → ${r.status} ${await r.text()}`);
  return r.json();
}

function dureeEnSecondes(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return null;
  return +(m[1] || 0) * 86400 + +(m[2] || 0) * 3600 + +(m[3] || 0) * 60 + +(m[4] || 0);
}

/** Dimensions de l'iframe renvoyée par part=player : révèlent le format de la vidéo. */
function rapport(embedHtml) {
  const l = /width="(\d+)"/.exec(embedHtml || '');
  const h = /height="(\d+)"/.exec(embedHtml || '');
  if (!l || !h) return null;
  return +l[1] / +h[1];
}

/**
 * En-têtes indispensables : sans eux, YouTube renvoie 302 vers consent.youtube.com
 * pour TOUTES les vidéos, ce qui faisait passer l'étalon pour « aucun Short ».
 * Le cookie de consentement est ce qui débloque la vraie réponse.
 */
const ENTETES = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  Cookie: 'CONSENT=YES+1; SOCS=CAI',
};

/** Vérité terrain : /shorts/<id> renvoie 200 pour un Short, 303 vers /watch sinon. */
async function estVraimentShort(id) {
  try {
    const r = await fetch(`https://www.youtube.com/shorts/${id}`, {
      method: 'GET',
      redirect: 'manual',
      headers: ENTETES,
    });
    if (r.status === 200) return true;
    const emplacement = r.headers.get('location') || '';
    if (emplacement.includes('/watch')) return false;
    // Consentement ou autre détour : indéterminé, et surtout pas compté comme « non ».
    return null;
  } catch {
    return null;
  }
}

async function principal() {
  const jeton = await jetonAcces();

  // Abonnements puis RSS, comme la sonde principale.
  const chaines = [];
  let page;
  do {
    const p = { part: 'snippet', mine: 'true', maxResults: '50', order: 'alphabetical' };
    if (page) p.pageToken = page;
    const r = await api('subscriptions', p, jeton);
    for (const i of r.items ?? []) chaines.push(i.snippet.resourceId.channelId);
    page = r.nextPageToken;
  } while (page);

  const analyseur = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });
  const ids = [];
  for (let i = 0; i < chaines.length; i += 8) {
    await Promise.all(
      chaines.slice(i, i + 8).map(async (c) => {
        try {
          const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${c}`);
          const doc = analyseur.parse(await r.text());
          const brut = doc.feed?.entry;
          const liste = brut ? (Array.isArray(brut) ? brut : [brut]) : [];
          // Deux vidéos par chaîne : on veut un échantillon large en nombre de chaînes.
          for (const e of liste.slice(0, 2)) if (e['yt:videoId']) ids.push(e['yt:videoId']);
        } catch {
          /* chaîne injoignable */
        }
      }),
    );
  }

  const retenus = ids.slice(0, ECHANTILLON);
  console.log(`Échantillon : ${retenus.length} vidéos sur ${chaines.length} chaînes.\n`);

  // Durées + format, en une seule requête par lot de 50.
  const infos = new Map();
  for (let i = 0; i < retenus.length; i += 50) {
    const r = await api(
      'videos',
      {
        part: 'contentDetails,player',
        id: retenus.slice(i, i + 50).join(','),
        maxHeight: '720',
      },
      jeton,
    );
    for (const it of r.items ?? []) {
      infos.set(it.id, {
        duree: dureeEnSecondes(it.contentDetails.duration),
        rapport: rapport(it.player?.embedHtml),
      });
    }
  }

  // Vérité terrain, par paquets de 10 pour ne pas saturer la connexion.
  const verite = new Map();
  const liste = [...infos.keys()];
  for (let i = 0; i < liste.length; i += 10) {
    const lot = liste.slice(i, i + 10);
    const r = await Promise.all(lot.map(estVraimentShort));
    lot.forEach((id, k) => verite.set(id, r[k]));
    process.stdout.write(`\r  vérification ${Math.min(i + 10, liste.length)}/${liste.length}`);
  }
  console.log('\n');

  // Comparaison
  const bilan = (nom, predicat) => {
    let vp = 0;
    let fp = 0;
    let fn = 0;
    let vn = 0;
    let connus = 0;
    for (const [id, info] of infos) {
      const vrai = verite.get(id);
      if (vrai === null || vrai === undefined) continue;
      connus += 1;
      const predit = predicat(info);
      if (predit && vrai) vp += 1;
      else if (predit && !vrai) fp += 1;
      else if (!predit && vrai) fn += 1;
      else vn += 1;
    }
    const exact = connus ? (((vp + vn) / connus) * 100).toFixed(1) : '—';
    console.log(
      `${nom.padEnd(42)} justes ${exact}%  ` +
        `· masquées à tort ${fp}  · Shorts ratés ${fn}  (sur ${connus})`,
    );
  };

  const verticales = [...infos.values()].filter((i) => i.rapport != null && i.rapport < 1).length;
  const avecRapport = [...infos.values()].filter((i) => i.rapport != null).length;
  const vraisShorts = [...verite.values()].filter((v) => v === true).length;
  const indetermines = [...verite.values()].filter((v) => v === null).length;
  console.log(
    `Format lisible pour ${avecRapport}/${infos.size} vidéos, dont ${verticales} verticales.`,
  );
  console.log(
    `Vérité terrain : ${vraisShorts} Shorts réels, ${indetermines} indéterminés.\n`,
  );

  bilan('A. durée ≤ 180 s (règle actuelle)', (i) => i.duree != null && i.duree <= 180);
  bilan('A′. durée ≤ 60 s', (i) => i.duree != null && i.duree <= 60);
  bilan('B. format vertical seul', (i) => i.rapport != null && i.rapport < 1);
  bilan(
    'C. vertical ET durée ≤ 180 s',
    (i) => i.rapport != null && i.rapport < 1 && i.duree != null && i.duree <= 180,
  );
  bilan(
    'D. vertical ET durée ≤ 60 s',
    (i) => i.rapport != null && i.rapport < 1 && i.duree != null && i.duree <= 60,
  );
  // Les trois Shorts manqués par C étaient carrés (rapport exactement 1.00).
  bilan(
    'F. rapport ≤ 1.00 ET durée ≤ 180 s',
    (i) => i.rapport != null && i.rapport <= 1 && i.duree != null && i.duree <= 180,
  );
  bilan(
    'G. rapport ≤ 1.05 ET durée ≤ 180 s',
    (i) => i.rapport != null && i.rapport <= 1.05 && i.duree != null && i.duree <= 180,
  );
  bilan(
    'E. vertical OU durée ≤ 60 s',
    (i) => (i.rapport != null && i.rapport < 1) || (i.duree != null && i.duree <= 60),
  );

  // Les rapports observés, pour vérifier que « vertical » est franc et non limite.
  const rapports = [...infos.values()].map((i) => i.rapport).filter((r) => r != null);
  const tri = rapports.slice().sort((a, b) => a - b);
  console.log(
    `\nRapports largeur/hauteur : min ${tri[0]?.toFixed(2)}, ` +
      `médiane ${tri[Math.floor(tri.length / 2)]?.toFixed(2)}, max ${tri.at(-1)?.toFixed(2)}`,
  );

  // Les désaccords de la meilleure règle : c'est là qu'on voit ce qu'on casse.
  console.log('\nDésaccords de la règle C (vertical ET ≤ 180 s) :');
  let montres = 0;
  for (const [id, info] of infos) {
    const vrai = verite.get(id);
    if (vrai == null) continue;
    const predit = info.rapport != null && info.rapport < 1 && info.duree != null && info.duree <= 180;
    if (predit !== vrai && montres < 10) {
      montres += 1;
      console.log(
        `  ${id} — ${vrai ? 'Short réel manqué' : 'masquée à tort'} · ` +
          `${info.duree} s · rapport ${info.rapport?.toFixed(2)}`,
      );
    }
  }
  if (montres === 0) console.log('  aucun');
}

principal().catch((e) => {
  console.error('\nÉchec :', e.message);
  process.exit(1);
});
