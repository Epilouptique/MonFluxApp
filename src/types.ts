// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE

/** Chaîne à laquelle l'utilisateur est abonné. */
export type Chaine = {
  id: string;
  titre: string;
  avatar: string | null;
  /** Date de récupération (ms). Sert à la purge des 30 jours imposée par YouTube. */
  recupereLe: number;
  /** Chaîne masquée du flux par l'utilisateur (0/1). */
  masquee: number;
};

/** Vidéo du flux. Les champs YouTube sont du cache, les états de lecture sont à nous. */
export type Video = {
  id: string;
  chaineId: string;
  titre: string;
  publieLe: number;
  miniature: string | null;
  /** Durée en secondes. null tant que videos.list n'a pas été appelé. */
  dureeS: number | null;
  /** 1 = Short, 0 = vidéo classique, null = indéterminé. */
  estShort: number | null;
  recupereLe: number;
};

/** États de lecture : nos données, jamais envoyées à YouTube, jamais purgées. */
export type EtatVideo = {
  videoId: string;
  vueLe: number | null;
  enregistreeLe: number | null;
};

/** Vidéo prête à afficher : cache YouTube + état local + nom de chaîne. */
export type VideoAffichee = Video & {
  chaineTitre: string;
  chaineAvatar: string | null;
  vueLe: number | null;
  enregistreeLe: number | null;
};


