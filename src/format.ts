// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept

/**
 * Détection des Shorts. L'API n'expose aucun indicateur ; deux signaux combinés
 * suffisent, et aucun ne coûte de quota supplémentaire :
 *
 *   - la durée : au-delà de 180 s, une vidéo n'est jamais un Short ;
 *   - le format : un Short est vertical ou carré. Le rapport largeur/hauteur se lit
 *     dans le code d'intégration renvoyé par videos.list avec part=player, dans la
 *     requête qu'on fait déjà pour les durées.
 *
 * Mesuré sur 120 vidéos de 161 chaînes réelles, étalonné contre la redirection de
 * youtube.com/shorts/<id> : 97,5 % de justesse et surtout zéro vidéo masquée à tort.
 * La durée seule tombait à 87,5 % avec 15 brèves masquées — l'erreur qui compte,
 * puisqu'elle fait disparaître du flux des vidéos qu'on voulait voir.
 *
 * Constantes placées ici, et non dans youtube.ts, pour rester testables sans charger
 * les modules natifs d'authentification.
 */
export const SEUIL_SHORT_S = 180;

/** Au-delà, la vidéo est en format paysage : ce n'est pas un Short. */
export const SEUIL_RAPPORT = 1;

/** Rapport largeur/hauteur lu dans le code d'intégration de videos.list. */
export function rapportEmbed(html: string | null | undefined): number | null {
  const l = /width="(\d+)"/.exec(html || '');
  const h = /height="(\d+)"/.exec(html || '');
  if (!l || !h || Number(h[1]) === 0) return null;
  return Number(l[1]) / Number(h[1]);
}

/**
 * 1 = Short, 0 = vidéo classique, null = indéterminé (on n'invente pas : une vidéo
 * dont on ne sait rien reste visible, c'est le sens du doute ici).
 */
export function classerShort(
  dureeS: number | null,
  rapport: number | null,
): number | null {
  if (dureeS == null) return null;
  if (dureeS > SEUIL_SHORT_S) return 0;
  if (rapport == null) return null;
  return rapport <= SEUIL_RAPPORT ? 1 : 0;
}

/** Convertit une durée ISO 8601 de l'API YouTube (PT1H2M3S) en secondes. */
export function dureeIsoEnSecondes(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  const [, j, h, mn, s] = m;
  return (
    Number(j || 0) * 86400 + Number(h || 0) * 3600 + Number(mn || 0) * 60 + Number(s || 0)
  );
}

/** 0:42, 12:05, 1:02:40 */
export function dureeLisible(secondes: number | null): string {
  if (secondes == null) return '';
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  const s = secondes % 60;
  const deux = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${deux(m)}:${deux(s)}` : `${m}:${deux(s)}`;
}

/** « il y a 3 h », « il y a 2 j ». Volontairement court : la vignette est étroite. */
export function dateRelative(ms: number, maintenant = Date.now()): string {
  const d = Math.max(0, Math.floor((maintenant - ms) / 1000));
  if (d < 60) return "à l'instant";
  if (d < 3600) return `il y a ${Math.floor(d / 60)} min`;
  if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`;
  if (d < 2592000) return `il y a ${Math.floor(d / 86400)} j`;
  return new Date(ms).toLocaleDateString('fr-FR');
}
