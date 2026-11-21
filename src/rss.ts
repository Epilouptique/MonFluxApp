// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Flux RSS publics de YouTube : https://www.youtube.com/feeds/videos.xml?channel_id=...
// Quinze dernières vidéos par chaîne, sans clé, sans jeton et sans quota. C'est la source
// des nouvelles vidéos ; l'API ne sert qu'aux abonnements et aux durées.

import { XMLParser } from 'fast-xml-parser';

const analyseur = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });

export type EntreeRss = {
  id: string;
  chaineId: string;
  titre: string;
  publieLe: number;
  miniature: string | null;
};

type Entree = {
  'yt:videoId'?: string;
  'yt:channelId'?: string;
  title?: string;
  published?: string;
  'media:group'?: { 'media:thumbnail'?: { '@url'?: string } };
};

export function analyserFlux(xml: string): EntreeRss[] {
  const doc = analyseur.parse(xml) as { feed?: { entry?: Entree | Entree[] } };
  const brut = doc.feed?.entry;
  if (!brut) return [];
  const entrees = Array.isArray(brut) ? brut : [brut];
  const sorties: EntreeRss[] = [];
  for (const e of entrees) {
    const id = e['yt:videoId'];
    const chaineId = e['yt:channelId'];
    if (!id || !chaineId) continue;
    const publie = e.published ? Date.parse(e.published) : NaN;
    sorties.push({
      id,
      chaineId,
      titre: String(e.title ?? '').trim(),
      publieLe: Number.isNaN(publie) ? Date.now() : publie,
      miniature:
        e['media:group']?.['media:thumbnail']?.['@url'] ??
        `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    });
  }
  return sorties;
}

/** Récupère et analyse le flux d'une chaîne. Renvoie [] si la chaîne est inaccessible. */
export async function recupererFluxChaine(chaineId: string): Promise<EntreeRss[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(chaineId)}`;
  const r = await fetch(url, { headers: { Accept: 'application/atom+xml' } });
  if (!r.ok) return [];
  return analyserFlux(await r.text());
}

/**
 * Récupère plusieurs chaînes avec un parallélisme borné : une centaine de requêtes
 * simultanées depuis un téléphone fait échouer la moitié des connexions.
 */
export async function recupererFlux(
  chaineIds: string[],
  parallele = 6,
  surAvancee?: (faits: number, total: number) => void,
): Promise<EntreeRss[]> {
  const sorties: EntreeRss[] = [];
  let index = 0;
  let faits = 0;
  async function ouvrier(): Promise<void> {
    for (;;) {
      const i = index;
      index += 1;
      if (i >= chaineIds.length) return;
      try {
        sorties.push(...(await recupererFluxChaine(chaineIds[i])));
      } catch {
        // Une chaîne injoignable ne doit pas faire échouer la synchronisation entière.
      }
      faits += 1;
      surAvancee?.(faits, chaineIds.length);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(parallele, chaineIds.length) }, () => ouvrier()),
  );
  return sorties;
}
