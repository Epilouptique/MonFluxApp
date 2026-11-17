// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Orchestration d'une actualisation : abonnements (API, rarement) → nouvelles vidéos (RSS)
// → durées des seules vidéos inconnues (API). Coût typique d'une ouverture : 1 à 3 unités
// de quota, l'essentiel du trafic passant par les flux RSS gratuits.

import * as db from './db';
import { recupererFlux } from './rss';
import { recupererAbonnements, recupererDetails } from './youtube';

/** Les abonnements changent rarement : on ne les redemande qu'une fois par jour. */
const FRAICHEUR_ABONNEMENTS_MS = 24 * 3600 * 1000;
const CLE_DERNIERE_SYNCHRO_CHAINES = 'derniere_synchro_chaines';
const CLE_DERNIERE_SYNCHRO = 'derniere_synchro';

export type Avancee = { etape: string; faits?: number; total?: number };

export async function derniereSynchro(): Promise<number | null> {
  const v = await db.lireReglage(CLE_DERNIERE_SYNCHRO);
  return v ? Number(v) : null;
}

export async function actualiser(
  surAvancee?: (a: Avancee) => void,
  forcerChaines = false,
): Promise<{ chaines: number; videos: number; purgees: number }> {
  // 1. Abonnements
  const derniere = Number((await db.lireReglage(CLE_DERNIERE_SYNCHRO_CHAINES)) ?? 0);
  const chainesPerimees = Date.now() - derniere > FRAICHEUR_ABONNEMENTS_MS;
  if (forcerChaines || chainesPerimees) {
    surAvancee?.({ etape: 'Abonnements' });
    const chaines = await recupererAbonnements();
    if (chaines.length > 0) {
      await db.enregistrerChaines(chaines);
      await db.ecrireReglage(CLE_DERNIERE_SYNCHRO_CHAINES, String(Date.now()));
    }
  }

  const chaines = await db.listerChaines();
  if (chaines.length === 0) return { chaines: 0, videos: 0, purgees: 0 };

  // 2. Nouvelles vidéos par RSS. Les chaînes masquées sont tout de même relevées : le
  // masquage est un filtre d'affichage, l'utilisateur peut le retirer à tout moment.
  surAvancee?.({ etape: 'Nouvelles vidéos', faits: 0, total: chaines.length });
  const entrees = await recupererFlux(
    chaines.map((c) => c.id),
    6,
    (faits, total) => surAvancee?.({ etape: 'Nouvelles vidéos', faits, total }),
  );
  await db.enregistrerVideos(entrees);

  // 3. Durées manquantes (sert aussi au filtre Shorts)
  const sansDuree = await db.videosSansDuree(300);
  if (sansDuree.length > 0) {
    surAvancee?.({ etape: 'Durées', faits: 0, total: sansDuree.length });
    await db.enregistrerDurees(await recupererDetails(sansDuree));
  }

  // 4. Respect des 30 jours de conservation imposés par les règles de l'API
  const purgees = await db.purgerCache();
  await db.ecrireReglage(CLE_DERNIERE_SYNCHRO, String(Date.now()));
  return { chaines: chaines.length, videos: entrees.length, purgees };
}
