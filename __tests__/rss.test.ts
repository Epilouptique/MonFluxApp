// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// L'analyse du flux RSS est le cœur de la récupération des vidéos : c'est la partie
// qui doit tenir si YouTube modifie des détails de forme.

import { analyserFlux } from '../src/rss';

/** Extrait réduit d'un vrai flux videos.xml, structure et préfixes conservés. */
const FLUX = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns:media="http://search.yahoo.com/mrss/"
      xmlns="http://www.w3.org/2005/Atom">
  <title>Chaîne d'essai</title>
  <entry>
    <id>yt:video:AAAAAAAAAAA</id>
    <yt:videoId>AAAAAAAAAAA</yt:videoId>
    <yt:channelId>UC0000000000000000000000</yt:channelId>
    <title>Première vidéo</title>
    <published>2026-11-17T08:30:00+00:00</published>
    <media:group>
      <media:thumbnail url="https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg" width="480" height="360"/>
    </media:group>
  </entry>
  <entry>
    <id>yt:video:BBBBBBBBBBB</id>
    <yt:videoId>BBBBBBBBBBB</yt:videoId>
    <yt:channelId>UC0000000000000000000000</yt:channelId>
    <title>Deuxième vidéo</title>
    <published>2026-11-16T19:00:00+00:00</published>
  </entry>
</feed>`;

describe('analyserFlux', () => {
  it('lit les entrées, les dates et les miniatures', () => {
    const e = analyserFlux(FLUX);
    expect(e).toHaveLength(2);
    expect(e[0]).toMatchObject({
      id: 'AAAAAAAAAAA',
      chaineId: 'UC0000000000000000000000',
      titre: 'Première vidéo',
      miniature: 'https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg',
    });
    expect(e[0].publieLe).toBe(Date.parse('2026-11-17T08:30:00Z'));
  });

  it('reconstruit une miniature quand media:group manque', () => {
    expect(analyserFlux(FLUX)[1].miniature).toBe(
      'https://i.ytimg.com/vi/BBBBBBBBBBB/mqdefault.jpg',
    );
  });

  it('gère une chaîne qui n’a publié qu’une vidéo (entry non répété)', () => {
    // fast-xml-parser renvoie alors un objet et non un tableau : piège classique.
    const unique = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <yt:videoId>CCCCCCCCCCC</yt:videoId>
    <yt:channelId>UC1111111111111111111111</yt:channelId>
    <title>Vidéo seule</title>
    <published>2026-11-15T10:00:00+00:00</published>
  </entry>
</feed>`;
    const e = analyserFlux(unique);
    expect(e).toHaveLength(1);
    expect(e[0].titre).toBe('Vidéo seule');
  });

  it('ne rend rien pour un flux vide ou cassé, sans lever', () => {
    expect(analyserFlux('<feed></feed>')).toEqual([]);
    expect(analyserFlux('')).toEqual([]);
  });

  it('ignore une entrée sans identifiant de vidéo', () => {
    const sansId = FLUX.replace('<yt:videoId>AAAAAAAAAAA</yt:videoId>', '');
    expect(analyserFlux(sansId)).toHaveLength(1);
  });
});
