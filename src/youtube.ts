// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Appels à l'API YouTube Data v3, réduits au strict nécessaire pour tenir dans le quota
// gratuit (10 000 unités/jour) :
//   - subscriptions.list : 1 unité par page de 50 abonnements, une fois par synchro ;
//   - videos.list        : 1 unité par lot de 50 vidéos, seulement pour les durées.
// Les nouvelles vidéos elles-mêmes arrivent par les flux RSS publics (voir rss.ts),
// qui ne consomment aucun quota.

import { jetonAcces } from './auth';
import { dureeIsoEnSecondes, SEUIL_SHORT_S } from './format';

const BASE = 'https://www.googleapis.com/youtube/v3';

export { SEUIL_SHORT_S };

async function appeler<T>(chemin: string, parametres: Record<string, string>): Promise<T> {
  const jeton = await jetonAcces();
  const url = `${BASE}/${chemin}?${new URLSearchParams(parametres).toString()}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${jeton}` } });
  if (!r.ok) {
    const corps = await r.text().catch(() => '');
    if (r.status === 403 && corps.includes('quotaExceeded')) throw new Error('QUOTA_DEPASSE');
    if (r.status === 401) throw new Error('NON_CONNECTE');
    throw new Error(`API YouTube ${r.status} : ${corps.slice(0, 200)}`);
  }
  return (await r.json()) as T;
}

type ReponseAbonnements = {
  nextPageToken?: string;
  items?: {
    snippet: {
      title: string;
      resourceId: { channelId: string };
      thumbnails?: Record<string, { url: string }>;
    };
  }[];
};

/** Toutes les chaînes suivies par le compte connecté. */
export async function recupererAbonnements(): Promise<
  { id: string; titre: string; avatar: string | null }[]
> {
  const chaines: { id: string; titre: string; avatar: string | null }[] = [];
  let page: string | undefined;
  // Garde-fou : 20 pages = 1 000 abonnements. Au-delà, on s'arrête plutôt que de
  // boucler indéfiniment sur une réponse inattendue.
  for (let i = 0; i < 20; i += 1) {
    const parametres: Record<string, string> = {
      part: 'snippet',
      mine: 'true',
      maxResults: '50',
      order: 'alphabetical',
    };
    if (page) parametres.pageToken = page;
    const r = await appeler<ReponseAbonnements>('subscriptions', parametres);
    for (const item of r.items ?? []) {
      const t = item.snippet.thumbnails;
      chaines.push({
        id: item.snippet.resourceId.channelId,
        titre: item.snippet.title,
        avatar: t?.default?.url ?? t?.medium?.url ?? null,
      });
    }
    if (!r.nextPageToken) break;
    page = r.nextPageToken;
  }
  return chaines;
}

type ReponseVideos = {
  items?: { id: string; contentDetails?: { duration?: string } }[];
};

/**
 * Durées des vidéos, par lots de 50. L'indicateur Short est déduit de la durée :
 * l'API ne fournit aucun champ fiable pour les distinguer (voir RESUME_TECHNIQUE.md).
 */
export async function recupererDetails(
  ids: string[],
): Promise<{ id: string; dureeS: number | null; estShort: number | null }[]> {
  const details: { id: string; dureeS: number | null; estShort: number | null }[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const lot = ids.slice(i, i + 50);
    const r = await appeler<ReponseVideos>('videos', {
      part: 'contentDetails',
      id: lot.join(','),
      maxResults: '50',
    });
    const vus = new Set<string>();
    for (const item of r.items ?? []) {
      const dureeS = dureeIsoEnSecondes(item.contentDetails?.duration);
      vus.add(item.id);
      details.push({
        id: item.id,
        dureeS,
        estShort: dureeS == null ? null : dureeS <= SEUIL_SHORT_S ? 1 : 0,
      });
    }
    // Vidéo supprimée ou privée depuis sa parution dans le flux RSS : on marque une
    // durée à 0 pour ne pas la redemander à chaque synchro.
    for (const id of lot) {
      if (!vus.has(id)) details.push({ id, dureeS: 0, estShort: 0 });
    }
  }
  return details;
}
