// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
//
// Deux choses se jouent ici. Les filtres du flux, dont les combinaisons sont la logique
// la plus dense de l'application ; et la purge à 30 jours, qui est une obligation des
// règles de l'API YouTube et doit épargner nos propres données de lecture.

jest.mock('expo-sqlite', () => require('./outils/sqlite-memoire'));

type ModuleDb = typeof import('../src/db');

let db: ModuleDb;

const JOUR = 24 * 3600 * 1000;

beforeEach(() => {
  // src/db.ts garde sa connexion dans une variable de module : il faut réinitialiser
  // les modules pour repartir d'une base vierge à chaque test.
  jest.resetModules();
  db = require('../src/db');
});

/** Jeu de données minimal : une chaîne, une vidéo longue, un Short. */
async function garnir() {
  await db.enregistrerChaines([{ id: 'UC_A', titre: 'Chaîne A', avatar: null }]);
  await db.enregistrerVideos([
    { id: 'longue', chaineId: 'UC_A', titre: 'Vidéo longue', publieLe: 2000, miniature: null },
    { id: 'courte', chaineId: 'UC_A', titre: 'Un Short', publieLe: 1000, miniature: null },
  ]);
  await db.enregistrerDurees([
    { id: 'longue', dureeS: 600, estShort: 0 },
    { id: 'courte', dureeS: 30, estShort: 1 },
  ]);
}

const ids = (liste: { id: string }[]) => liste.map((v) => v.id);

describe('filtres du flux', () => {
  it('écarte les Shorts par défaut', async () => {
    await garnir();
    const flux = await db.listerFlux({ afficherShorts: false, afficherVues: true });
    expect(ids(flux)).toEqual(['longue']);
  });

  it('les inclut quand on le demande, le plus récent d’abord', async () => {
    await garnir();
    const flux = await db.listerFlux({ afficherShorts: true, afficherVues: true });
    expect(ids(flux)).toEqual(['longue', 'courte']);
  });

  it('garde les vidéos de durée inconnue quand les Shorts sont masqués', async () => {
    // Une vidéo dont la durée n'est pas encore connue ne doit pas disparaître du flux :
    // sinon elle resterait invisible jusqu'à la synchronisation suivante.
    await db.enregistrerChaines([{ id: 'UC_A', titre: 'Chaîne A', avatar: null }]);
    await db.enregistrerVideos([
      { id: 'inconnue', chaineId: 'UC_A', titre: 'Sans durée', publieLe: 3000, miniature: null },
    ]);
    const flux = await db.listerFlux({ afficherShorts: false, afficherVues: true });
    expect(ids(flux)).toEqual(['inconnue']);
  });

  it('ne retient que les Shorts dans l’onglet dédié', async () => {
    await garnir();
    const flux = await db.listerFlux({
      afficherShorts: false,
      afficherVues: true,
      shortsSeuls: true,
    });
    expect(ids(flux)).toEqual(['courte']);
  });

  it('masque les vidéos vues quand c’est demandé', async () => {
    await garnir();
    await db.marquerVue('longue', true);
    const flux = await db.listerFlux({ afficherShorts: true, afficherVues: false });
    expect(ids(flux)).toEqual(['courte']);
  });

  it('montre une vidéo enregistrée même déjà vue', async () => {
    // « À regarder » est une liste voulue par l'utilisateur : le filtre des vues ne doit
    // pas y faire disparaître ce qu'il y a lui-même rangé.
    await garnir();
    await db.marquerVue('longue', true);
    await db.basculerEnregistrement('longue');
    const flux = await db.listerFlux({
      afficherShorts: true,
      afficherVues: false,
      enregistreesSeules: true,
    });
    expect(ids(flux)).toEqual(['longue']);
  });

  it('exclut les chaînes masquées', async () => {
    await garnir();
    await db.basculerMasquage('UC_A');
    const flux = await db.listerFlux({ afficherShorts: true, afficherVues: true });
    expect(flux).toEqual([]);
  });

  it('restreint à une chaîne quand on en nomme une', async () => {
    await garnir();
    await db.enregistrerChaines([{ id: 'UC_B', titre: 'Chaîne B', avatar: null }]);
    await db.enregistrerVideos([
      { id: 'autre', chaineId: 'UC_B', titre: 'Ailleurs', publieLe: 4000, miniature: null },
    ]);
    const flux = await db.listerFlux({
      afficherShorts: true,
      afficherVues: true,
      chaineId: 'UC_B',
    });
    expect(ids(flux)).toEqual(['autre']);
  });
});

describe('états de lecture', () => {
  it('bascule l’enregistrement dans les deux sens', async () => {
    await garnir();
    await db.basculerEnregistrement('longue');
    const options = { afficherShorts: true, afficherVues: true, enregistreesSeules: true };
    expect(ids(await db.listerFlux(options))).toEqual(['longue']);
    await db.basculerEnregistrement('longue');
    expect(await db.listerFlux(options)).toEqual([]);
  });

  it('retire la marque « vue »', async () => {
    await garnir();
    await db.marquerVue('longue', true);
    await db.marquerVue('longue', false);
    const flux = await db.listerFlux({ afficherShorts: true, afficherVues: false });
    expect(ids(flux)).toContain('longue');
  });
});

describe('durées et masquage de chaîne', () => {
  it('ne réclame que les vidéos sans durée connue', async () => {
    await garnir();
    await db.enregistrerVideos([
      { id: 'neuve', chaineId: 'UC_A', titre: 'Nouvelle', publieLe: 5000, miniature: null },
    ]);
    expect(await db.videosSansDuree()).toEqual(['neuve']);
  });

  it('conserve le masquage d’une chaîne quand les abonnements sont réécrits', async () => {
    // La synchronisation quotidienne réenregistre toutes les chaînes : si elle écrasait
    // le masquage, les chaînes masquées réapparaîtraient chaque jour.
    await garnir();
    await db.basculerMasquage('UC_A');
    await db.enregistrerChaines([{ id: 'UC_A', titre: 'Chaîne A renommée', avatar: null }]);
    const [chaine] = await db.listerChaines();
    expect(chaine.masquee).toBe(1);
    expect(chaine.titre).toBe('Chaîne A renommée');
  });

  it('ne réécrit pas la durée déjà connue lors d’une nouvelle lecture du flux', async () => {
    await garnir();
    await db.enregistrerVideos([
      { id: 'longue', chaineId: 'UC_A', titre: 'Titre corrigé', publieLe: 2000, miniature: null },
    ]);
    const [video] = await db.listerFlux({ afficherShorts: true, afficherVues: true });
    expect(video.titre).toBe('Titre corrigé');
    expect(video.dureeS).toBe(600);
  });
});

describe('purge du cache à 30 jours', () => {
  it('supprime les vidéos relevées il y a plus de 30 jours', async () => {
    await garnir();
    const supprimees = await db.purgerCache(Date.now() + 31 * JOUR);
    expect(supprimees).toBe(2);
    expect(await db.listerFlux({ afficherShorts: true, afficherVues: true })).toEqual([]);
  });

  it('épargne les vidéos rangées dans « À regarder »', async () => {
    await garnir();
    await db.basculerEnregistrement('longue');
    const supprimees = await db.purgerCache(Date.now() + 31 * JOUR);
    expect(supprimees).toBe(1);
    expect(ids(await db.listerFlux({ afficherShorts: true, afficherVues: true }))).toEqual([
      'longue',
    ]);
  });

  it('ne touche à rien avant l’échéance', async () => {
    await garnir();
    expect(await db.purgerCache(Date.now() + 29 * JOUR)).toBe(0);
  });

  it('ne supprime jamais les états de lecture, qui ne sont pas du cache YouTube', async () => {
    // C'est la raison d'être de la séparation des tables : la contrainte des 30 jours
    // porte sur les données YouTube, pas sur ce que l'utilisateur a fait.
    await garnir();
    await db.marquerVue('courte', true);
    await db.purgerCache(Date.now() + 31 * JOUR);

    // La vidéo revient par le flux RSS : son état « vue » doit avoir survécu.
    await db.enregistrerVideos([
      { id: 'courte', chaineId: 'UC_A', titre: 'Un Short', publieLe: 1000, miniature: null },
    ]);
    const flux = await db.listerFlux({ afficherShorts: true, afficherVues: false });
    expect(ids(flux)).not.toContain('courte');
  });
});

describe('effacement complet', () => {
  it('ne laisse rien derrière lui à la déconnexion', async () => {
    await garnir();
    await db.marquerVue('longue', true);
    await db.ecrireReglage('derniere_synchro', '1234');
    await db.toutEffacer();

    expect(await db.listerChaines()).toEqual([]);
    expect(await db.listerFlux({ afficherShorts: true, afficherVues: true })).toEqual([]);
    expect(await db.lireReglage('derniere_synchro')).toBeNull();
  });
});
