// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE

import {
  classerShort,
  dateRelative,
  dureeIsoEnSecondes,
  dureeLisible,
  rapportEmbed,
  SEUIL_SHORT_S,
} from '../src/format';

describe('durées ISO 8601 de l’API YouTube', () => {
  it('lit les formats courants', () => {
    expect(dureeIsoEnSecondes('PT42S')).toBe(42);
    expect(dureeIsoEnSecondes('PT12M5S')).toBe(725);
    expect(dureeIsoEnSecondes('PT1H2M40S')).toBe(3760);
    expect(dureeIsoEnSecondes('PT1H')).toBe(3600);
  });

  it('lit les directs longs exprimés en jours', () => {
    expect(dureeIsoEnSecondes('P1DT2H')).toBe(93600);
  });

  it('renvoie null plutôt que 0 quand la durée est absente ou illisible', () => {
    // Important : 0 signifierait « vidéo supprimée », null signifie « pas encore su ».
    expect(dureeIsoEnSecondes(null)).toBeNull();
    expect(dureeIsoEnSecondes('')).toBeNull();
    expect(dureeIsoEnSecondes('n’importe quoi')).toBeNull();
  });
});

describe('affichage des durées', () => {
  it('omet les heures quand il n’y en a pas', () => {
    expect(dureeLisible(42)).toBe('0:42');
    expect(dureeLisible(725)).toBe('12:05');
    expect(dureeLisible(3760)).toBe('1:02:40');
  });

  it('n’affiche rien pour une durée inconnue', () => {
    expect(dureeLisible(null)).toBe('');
  });
});

describe('détection des Shorts', () => {
  it('lit le rapport largeur/hauteur du code d’intégration', () => {
    expect(rapportEmbed('<iframe width="405" height="720" src="…"></iframe>')).toBeCloseTo(
      0.5625,
    );
    expect(rapportEmbed('<iframe width="1280" height="720"></iframe>')).toBeCloseTo(1.78);
    expect(rapportEmbed('<iframe></iframe>')).toBeNull();
    expect(rapportEmbed(null)).toBeNull();
  });

  it('classe Short une vidéo courte et verticale', () => {
    expect(classerShort(45, 0.56)).toBe(1);
    expect(classerShort(175, 0.56)).toBe(1);
  });

  it('classe Short une vidéo courte et carrée', () => {
    // Trois Shorts réels de l'échantillon avaient exactement ce rapport.
    expect(classerShort(112, 1)).toBe(1);
  });

  it('ne masque pas une brève horizontale, même très courte', () => {
    // Le cas qui comptait : la durée seule masquait 15 vidéos de ce type sur 120.
    expect(classerShort(90, 1.78)).toBe(0);
    expect(classerShort(30, 1.78)).toBe(0);
  });

  it('écarte toute vidéo plus longue que le seuil, sans regarder le format', () => {
    expect(classerShort(SEUIL_SHORT_S + 1, 0.56)).toBe(0);
  });

  it('reste indéterminé plutôt que de deviner', () => {
    // null = la vidéo reste visible : on ne masque jamais sur une supposition.
    expect(classerShort(null, 0.56)).toBeNull();
    expect(classerShort(45, null)).toBeNull();
  });
});

describe('dates relatives', () => {
  const t = Date.parse('2026-11-17T12:00:00Z');
  it('reste court et en français', () => {
    expect(dateRelative(t - 30_000, t)).toBe("à l'instant");
    expect(dateRelative(t - 5 * 60_000, t)).toBe('il y a 5 min');
    expect(dateRelative(t - 3 * 3600_000, t)).toBe('il y a 3 h');
    expect(dateRelative(t - 2 * 86400_000, t)).toBe('il y a 2 j');
  });

  it('passe à la date absolue au-delà d’un mois', () => {
    expect(dateRelative(t - 60 * 86400_000, t)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
