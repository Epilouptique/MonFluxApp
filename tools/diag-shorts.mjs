// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Diagnostic : youtube.com/shorts/<id> permet-il vraiment de distinguer un Short ?
// Aucun jeton requis : on part d'une chaîne publique et de son flux RSS.
//   node tools/diag-shorts.mjs @francetv

const handle = process.argv[2] || '@francetv';

const ENTETES = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  Cookie: 'CONSENT=YES+1; SOCS=CAI',
};

const page = await fetch(`https://www.youtube.com/${handle}`, { headers: ENTETES });
const html = await page.text();
const idChaine = /"(UC[\w-]{22})"/.exec(html)?.[1];
if (!idChaine) {
  console.error(`Identifiant de chaîne introuvable pour ${handle} (statut ${page.status}).`);
  process.exit(1);
}
console.log(`${handle} → ${idChaine}\n`);

const flux = await fetch(
  `https://www.youtube.com/feeds/videos.xml?channel_id=${idChaine}`,
).then((r) => r.text());
const ids = [...flux.matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((m) => m[1]);
const titres = [...flux.matchAll(/<media:title>([^<]*)<\/media:title>/g)].map((m) => m[1]);

for (const [i, id] of ids.entries()) {
  const sansEntetes = await fetch(`https://www.youtube.com/shorts/${id}`, {
    redirect: 'manual',
  });
  const avecEntetes = await fetch(`https://www.youtube.com/shorts/${id}`, {
    redirect: 'manual',
    headers: ENTETES,
  });
  const dest = (r) => {
    const l = r.headers.get('location');
    return `${r.status}${l ? ` → ${l.replace('https://', '').slice(0, 45)}` : ''}`;
  };
  let marqueur = '';
  if (avecEntetes.status === 200) {
    const corps = await avecEntetes.text();
    marqueur = /reelPlayerOverlayRenderer|isShortsEligible|"shorts"/.test(corps)
      ? ' · marqueurs reel PRÉSENTS'
      : ' · pas de marqueur reel';
  }
  console.log(
    `${id}  brut ${dest(sansEntetes).padEnd(22)} navigateur ${dest(avecEntetes).padEnd(22)}${marqueur}`,
  );
  console.log(`         ${(titres[i] || '').slice(0, 70)}`);
}
