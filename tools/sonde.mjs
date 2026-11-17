// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
//
// Sonde de faisabilité (phases 0 à 2 du cahier des charges), exécutée depuis le PC :
// elle valide la chaîne complète OAuth → abonnements → flux RSS → durées SANS avoir
// besoin d'un iPhone, d'un Mac ni d'un compte développeur Apple.
//
//   node tools/sonde.mjs
//
// Prérequis : un identifiant client OAuth de type « Application de bureau » dans Google
// Cloud Console (distinct du client iOS de l'application), exporté dans l'environnement :
//   set SONDE_CLIENT_ID=...apps.googleusercontent.com
//   set SONDE_CLIENT_SECRET=...
// Le jeton de rafraîchissement obtenu est écrit dans .sonde.json (ignoré par Git).

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { XMLParser } from 'fast-xml-parser';

const CLIENT_ID = process.env.SONDE_CLIENT_ID;
const CLIENT_SECRET = process.env.SONDE_CLIENT_SECRET;
const PORT = 8723;
const REDIRECTION = `http://127.0.0.1:${PORT}/retour`;
const PORTEE = 'https://www.googleapis.com/auth/youtube.readonly';
const FICHIER_JETON = new URL('../.sonde.json', import.meta.url);

let unites = 0;

function base64url(b) {
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function autoriser() {
  const verificateur = base64url(crypto.randomBytes(32));
  const defi = base64url(crypto.createHash('sha256').update(verificateur).digest());
  const url =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECTION,
      response_type: 'code',
      scope: PORTEE,
      access_type: 'offline',
      // select_account force le choix du compte : sans lui, Google réutilise en
      // silence la session du navigateur, ce qui empêche de sonder un autre compte.
      prompt: 'consent select_account',
      code_challenge: defi,
      code_challenge_method: 'S256',
    });

  const code = await new Promise((resoudre, rejeter) => {
    const serveur = http.createServer((req, res) => {
      const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
      if (u.pathname !== '/retour') return res.end();
      const c = u.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Connexion acceptée</h1><p>Tu peux fermer cet onglet.</p>');
      serveur.close();
      c ? resoudre(c) : rejeter(new Error(u.searchParams.get('error') || 'refus'));
    });
    serveur.listen(PORT, '127.0.0.1', () => {
      console.log('→ Ouverture du navigateur pour la connexion Google…');
      exec(`start "" "${url}"`, { shell: 'cmd.exe' });
    });
  });

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      code_verifier: verificateur,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECTION,
    }),
  });
  if (!r.ok) throw new Error(`Échange du code refusé : ${await r.text()}`);
  const jetons = await r.json();
  await fs.writeFile(FICHIER_JETON, JSON.stringify({ refresh_token: jetons.refresh_token }));
  return jetons.access_token;
}

async function jetonAcces() {
  let refresh = null;
  try {
    refresh = JSON.parse(await fs.readFile(FICHIER_JETON, 'utf8')).refresh_token;
  } catch {
    // Première exécution : pas encore de jeton enregistré.
  }
  if (!refresh) return autoriser();
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  });
  if (!r.ok) {
    console.log('Jeton enregistré invalide, nouvelle autorisation.');
    return autoriser();
  }
  return (await r.json()).access_token;
}

async function api(chemin, parametres, jeton) {
  unites += 1;
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

async function principal() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(
      'SONDE_CLIENT_ID et SONDE_CLIENT_SECRET sont requis (voir docs/google-cloud.md).',
    );
    process.exit(1);
  }
  const t0 = Date.now();
  const jeton = await jetonAcces();

  // 1. Abonnements
  const chaines = [];
  let page;
  do {
    const p = { part: 'snippet', mine: 'true', maxResults: '50', order: 'alphabetical' };
    if (page) p.pageToken = page;
    const r = await api('subscriptions', p, jeton);
    for (const i of r.items ?? []) {
      chaines.push({ id: i.snippet.resourceId.channelId, titre: i.snippet.title });
    }
    page = r.nextPageToken;
  } while (page);
  console.log(`\n1. Abonnements : ${chaines.length} chaînes (${unites} unité(s) de quota)`);

  // 2. Flux RSS (gratuits, aucun quota)
  const analyseur = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });
  const entrees = [];
  let echecs = 0;
  const debutRss = Date.now();
  for (let i = 0; i < chaines.length; i += 6) {
    await Promise.all(
      chaines.slice(i, i + 6).map(async (c) => {
        try {
          const r = await fetch(
            `https://www.youtube.com/feeds/videos.xml?channel_id=${c.id}`,
          );
          if (!r.ok) throw new Error(String(r.status));
          const doc = analyseur.parse(await r.text());
          const brut = doc.feed?.entry;
          const liste = brut ? (Array.isArray(brut) ? brut : [brut]) : [];
          for (const e of liste) {
            if (e['yt:videoId']) {
              entrees.push({
                id: e['yt:videoId'],
                chaine: c.titre,
                titre: e.title,
                publie: e.published,
              });
            }
          }
        } catch {
          echecs += 1;
        }
      }),
    );
  }
  console.log(
    `2. Flux RSS : ${entrees.length} vidéos, ${echecs} chaîne(s) en échec, ` +
      `${((Date.now() - debutRss) / 1000).toFixed(1)} s, 0 unité de quota`,
  );

  // 3. Durées et classement Shorts
  const ids = [...new Set(entrees.map((e) => e.id))].slice(0, 200);
  const durees = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const r = await api(
      'videos',
      { part: 'contentDetails', id: ids.slice(i, i + 50).join(','), maxResults: '50' },
      jeton,
    );
    for (const it of r.items ?? []) durees.set(it.id, dureeEnSecondes(it.contentDetails.duration));
  }
  const courtes = [...durees.values()].filter((d) => d != null && d <= 180).length;
  const tresCourtes = [...durees.values()].filter((d) => d != null && d <= 60).length;
  console.log(
    `3. Durées : ${durees.size} vidéos analysées, ${courtes} de 3 min ou moins ` +
      `(dont ${tresCourtes} de 1 min ou moins) — candidates « Short »`,
  );
  console.log(`   Vidéos absentes de la réponse (privées/supprimées) : ${ids.length - durees.size}`);

  // 4. Bilan
  const parJour = unites;
  console.log(
    `\nBilan : ${unites} unité(s) de quota pour une synchronisation complète ` +
      `(${((Date.now() - t0) / 1000).toFixed(1)} s au total).`,
  );
  console.log(
    `Quota gratuit : 10 000 unités/jour, soit environ ${Math.floor(10000 / Math.max(parJour, 1))} ` +
      `synchronisations complètes par jour. En usage courant, seules les nouvelles vidéos ` +
      `demandent des durées : le coût réel est plus proche de 1 à 2 unités par ouverture.`,
  );
  const recentes = entrees
    .filter((e) => Date.now() - Date.parse(e.publie) < 48 * 3600 * 1000)
    .sort((a, b) => Date.parse(b.publie) - Date.parse(a.publie));
  console.log(`\nDernières 48 h : ${recentes.length} vidéos. Cinq plus récentes :`);
  for (const e of recentes.slice(0, 5)) {
    console.log(`  · ${e.chaine} — ${e.titre} (${durees.get(e.id) ?? '?'} s)`);
  }
}

principal().catch((e) => {
  console.error('\nÉchec :', e.message);
  process.exit(1);
});
