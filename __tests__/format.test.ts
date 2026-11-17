// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept

import {
  dateRelative,
  dureeIsoEnSecondes,
  dureeLisible,
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

describe('seuil de détection des Shorts', () => {
  it('classe les vidéos selon la limite de 3 minutes', () => {
    expect(dureeIsoEnSecondes('PT58S')! <= SEUIL_SHORT_S).toBe(true);
    expect(dureeIsoEnSecondes('PT3M')! <= SEUIL_SHORT_S).toBe(true);
    expect(dureeIsoEnSecondes('PT3M1S')! <= SEUIL_SHORT_S).toBe(false);
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
