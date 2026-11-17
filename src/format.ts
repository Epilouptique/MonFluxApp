// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept

/**
 * Au-delà de cette durée, une vidéo n'est jamais un Short (limite YouTube : 3 min).
 * C'est notre seul critère de détection : l'API n'expose aucun indicateur fiable.
 * Constante placée ici, et non dans youtube.ts, pour rester testable sans charger
 * les modules natifs d'authentification.
 */
export const SEUIL_SHORT_S = 180;

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
