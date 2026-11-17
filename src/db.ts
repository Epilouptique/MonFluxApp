// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Base locale SQLite. Deux natures de données strictement séparées :
//   - cache YouTube (chaines, videos) : purgeable, soumis aux 30 jours des règles YouTube ;
//   - états de lecture (etats) : nos données, conservées sans limite de durée.
// La purge ne touche jamais la table etats, c'est tout l'intérêt de cette séparation.

import * as SQLite from 'expo-sqlite';
import type { Chaine, VideoAffichee } from './types';

const NOM = 'monflux.db';
/** Durée de conservation du cache YouTube (règles API : 30 jours). */
export const CONSERVATION_MS = 30 * 24 * 3600 * 1000;

let bdd: SQLite.SQLiteDatabase | null = null;

export async function ouvrir(): Promise<SQLite.SQLiteDatabase> {
  if (bdd) return bdd;
  bdd = await SQLite.openDatabaseAsync(NOM);
  await bdd.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS chaines (
      id TEXT PRIMARY KEY NOT NULL,
      titre TEXT NOT NULL,
      avatar TEXT,
      recupere_le INTEGER NOT NULL,
      masquee INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY NOT NULL,
      chaine_id TEXT NOT NULL,
      titre TEXT NOT NULL,
      publie_le INTEGER NOT NULL,
      miniature TEXT,
      duree_s INTEGER,
      est_short INTEGER,
      recupere_le INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_videos_date ON videos (publie_le DESC);
    CREATE TABLE IF NOT EXISTS etats (
      video_id TEXT PRIMARY KEY NOT NULL,
      vue_le INTEGER,
      enregistree_le INTEGER
    );
    CREATE TABLE IF NOT EXISTS reglages (
      cle TEXT PRIMARY KEY NOT NULL,
      valeur TEXT NOT NULL
    );
  `);
  return bdd;
}

/* ------------------------------------------------------------------ chaînes */

export async function enregistrerChaines(
  chaines: { id: string; titre: string; avatar: string | null }[],
): Promise<void> {
  const db = await ouvrir();
  const t = Date.now();
  await db.withTransactionAsync(async () => {
    for (const c of chaines) {
      await db.runAsync(
        `INSERT INTO chaines (id, titre, avatar, recupere_le, masquee)
         VALUES (?, ?, ?, ?, COALESCE((SELECT masquee FROM chaines WHERE id = ?), 0))
         ON CONFLICT(id) DO UPDATE SET titre = excluded.titre,
           avatar = excluded.avatar, recupere_le = excluded.recupere_le`,
        [c.id, c.titre, c.avatar, t, c.id],
      );
    }
  });
}

export async function listerChaines(): Promise<Chaine[]> {
  const db = await ouvrir();
  return db.getAllAsync<Chaine>(
    `SELECT id, titre, avatar, recupere_le AS recupereLe, masquee
     FROM chaines ORDER BY titre COLLATE NOCASE`,
  );
}

export async function basculerMasquage(chaineId: string): Promise<void> {
  const db = await ouvrir();
  await db.runAsync(
    'UPDATE chaines SET masquee = CASE masquee WHEN 1 THEN 0 ELSE 1 END WHERE id = ?',
    [chaineId],
  );
}

/* ------------------------------------------------------------------- vidéos */

export async function enregistrerVideos(
  videos: {
    id: string;
    chaineId: string;
    titre: string;
    publieLe: number;
    miniature: string | null;
  }[],
): Promise<void> {
  const db = await ouvrir();
  const t = Date.now();
  await db.withTransactionAsync(async () => {
    for (const v of videos) {
      // Le titre et la miniature peuvent changer : on rafraîchit. La durée et l'indicateur
      // Short viennent d'un second appel, on ne les écrase pas ici.
      await db.runAsync(
        `INSERT INTO videos (id, chaine_id, titre, publie_le, miniature, recupere_le)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET titre = excluded.titre,
           miniature = excluded.miniature, recupere_le = excluded.recupere_le`,
        [v.id, v.chaineId, v.titre, v.publieLe, v.miniature, t],
      );
    }
  });
}

/** Identifiants de vidéos dont on ne connaît pas encore la durée. */
export async function videosSansDuree(limite = 200): Promise<string[]> {
  const db = await ouvrir();
  const lignes = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM videos WHERE duree_s IS NULL ORDER BY publie_le DESC LIMIT ?',
    [limite],
  );
  return lignes.map((l) => l.id);
}

export async function enregistrerDurees(
  details: { id: string; dureeS: number | null; estShort: number | null }[],
): Promise<void> {
  const db = await ouvrir();
  await db.withTransactionAsync(async () => {
    for (const d of details) {
      await db.runAsync('UPDATE videos SET duree_s = ?, est_short = ? WHERE id = ?', [
        d.dureeS,
        d.estShort,
        d.id,
      ]);
    }
  });
}

type OptionsFlux = {
  afficherShorts: boolean;
  afficherVues: boolean;
  /** Onglet Shorts : uniquement les vidéos détectées comme telles. */
  shortsSeuls?: boolean;
  chaineId?: string;
  /** Mode « À regarder » : uniquement les vidéos enregistrées. */
  enregistreesSeules?: boolean;
  limite?: number;
};

export async function listerFlux(o: OptionsFlux): Promise<VideoAffichee[]> {
  const db = await ouvrir();
  const conditions: string[] = ['c.masquee = 0'];
  const params: (string | number)[] = [];
  if (o.shortsSeuls) conditions.push('v.est_short = 1');
  else if (!o.afficherShorts) conditions.push('(v.est_short IS NULL OR v.est_short = 0)');
  if (!o.afficherVues && !o.enregistreesSeules) conditions.push('e.vue_le IS NULL');
  if (o.chaineId) {
    conditions.push('v.chaine_id = ?');
    params.push(o.chaineId);
  }
  if (o.enregistreesSeules) conditions.push('e.enregistree_le IS NOT NULL');
  params.push(o.limite ?? 300);
  return db.getAllAsync<VideoAffichee>(
    `SELECT v.id, v.chaine_id AS chaineId, v.titre, v.publie_le AS publieLe,
            v.miniature, v.duree_s AS dureeS, v.est_short AS estShort,
            v.recupere_le AS recupereLe,
            c.titre AS chaineTitre, c.avatar AS chaineAvatar,
            e.vue_le AS vueLe, e.enregistree_le AS enregistreeLe
     FROM videos v
     JOIN chaines c ON c.id = v.chaine_id
     LEFT JOIN etats e ON e.video_id = v.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${o.enregistreesSeules ? 'e.enregistree_le DESC' : 'v.publie_le DESC'}
     LIMIT ?`,
    params,
  );
}

/* -------------------------------------------------------------------- états */

export async function marquerVue(videoId: string, vue: boolean): Promise<void> {
  const db = await ouvrir();
  await db.runAsync(
    `INSERT INTO etats (video_id, vue_le) VALUES (?, ?)
     ON CONFLICT(video_id) DO UPDATE SET vue_le = excluded.vue_le`,
    [videoId, vue ? Date.now() : null],
  );
}

export async function basculerEnregistrement(videoId: string): Promise<void> {
  const db = await ouvrir();
  await db.runAsync(
    `INSERT INTO etats (video_id, enregistree_le) VALUES (?, ?)
     ON CONFLICT(video_id) DO UPDATE SET
       enregistree_le = CASE WHEN etats.enregistree_le IS NULL THEN ? ELSE NULL END`,
    [videoId, Date.now(), Date.now()],
  );
}

/* ----------------------------------------------------------------- réglages */

export async function lireReglage(cle: string): Promise<string | null> {
  const db = await ouvrir();
  const l = await db.getFirstAsync<{ valeur: string }>(
    'SELECT valeur FROM reglages WHERE cle = ?',
    [cle],
  );
  return l?.valeur ?? null;
}

export async function ecrireReglage(cle: string, valeur: string): Promise<void> {
  const db = await ouvrir();
  await db.runAsync(
    `INSERT INTO reglages (cle, valeur) VALUES (?, ?)
     ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur`,
    [cle, valeur],
  );
}

/* -------------------------------------------------------------------- purge */

/**
 * Supprime le cache YouTube plus vieux que 30 jours, sauf les vidéos encore utiles
 * à l'utilisateur (enregistrées « à regarder »), qui sont rafraîchies à la synchro.
 * Les états de lecture ne sont jamais supprimés : ce sont nos données.
 */
export async function purgerCache(maintenant = Date.now()): Promise<number> {
  const db = await ouvrir();
  const limite = maintenant - CONSERVATION_MS;
  const r = await db.runAsync(
    `DELETE FROM videos WHERE recupere_le < ?
       AND id NOT IN (SELECT video_id FROM etats WHERE enregistree_le IS NOT NULL)`,
    [limite],
  );
  return r.changes ?? 0;
}

/** Déconnexion : tout le local disparaît, y compris nos états. */
export async function toutEffacer(): Promise<void> {
  const db = await ouvrir();
  await db.execAsync(
    'DELETE FROM videos; DELETE FROM chaines; DELETE FROM etats; DELETE FROM reglages;',
  );
}
