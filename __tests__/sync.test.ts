// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
//
// La synchronisation est l'endroit où le quota se dépense. Ces tests verrouillent les
// décisions qui le préservent : ne redemander les abonnements qu'une fois par jour, et
// ne jamais enregistrer une synchronisation qui n'a rien rapporté.

jest.mock('../src/db');
jest.mock('../src/rss');
jest.mock('../src/youtube');

import * as db from '../src/db';
import { recupererFlux } from '../src/rss';
import { recupererAbonnements, recupererDetails } from '../src/youtube';
import { actualiser } from '../src/sync';

const simule = <T extends (...a: never[]) => unknown>(f: T) => f as jest.MockedFunction<T>;

const reglages = new Map<string, string>();

beforeEach(() => {
  jest.clearAllMocks();
  reglages.clear();

  simule(db.lireReglage).mockImplementation(async (c: string) => reglages.get(c) ?? null);
  simule(db.ecrireReglage).mockImplementation(async (c: string, v: string) => {
    reglages.set(c, v);
  });
  simule(db.listerChaines).mockResolvedValue([
    { id: 'UC_A', titre: 'A', avatar: null, masquee: 0 },
  ] as never);
  simule(db.enregistrerChaines).mockResolvedValue(undefined as never);
  simule(db.enregistrerVideos).mockResolvedValue(undefined as never);
  simule(db.enregistrerDurees).mockResolvedValue(undefined as never);
  simule(db.videosSansDuree).mockResolvedValue([] as never);
  simule(db.purgerCache).mockResolvedValue(0 as never);

  simule(recupererFlux).mockResolvedValue([] as never);
  simule(recupererAbonnements).mockResolvedValue([
    { id: 'UC_A', titre: 'A', avatar: null },
  ] as never);
  simule(recupererDetails).mockResolvedValue([] as never);
});

describe('économie de quota sur les abonnements', () => {
  it('ne redemande pas les abonnements s’ils datent de moins de 24 h', async () => {
    reglages.set('derniere_synchro_chaines', String(Date.now() - 3600 * 1000));
    await actualiser();
    expect(recupererAbonnements).not.toHaveBeenCalled();
  });

  it('les redemande au-delà de 24 h', async () => {
    reglages.set('derniere_synchro_chaines', String(Date.now() - 25 * 3600 * 1000));
    await actualiser();
    expect(recupererAbonnements).toHaveBeenCalledTimes(1);
  });

  it('les redemande sur demande explicite, même récents', async () => {
    reglages.set('derniere_synchro_chaines', String(Date.now()));
    await actualiser(undefined, true);
    expect(recupererAbonnements).toHaveBeenCalledTimes(1);
  });

  it('n’enregistre rien si l’API renvoie une liste vide', async () => {
    // Une réponse vide est plus probablement un incident qu'un compte réellement vidé
    // de ses abonnements : l'écraser effacerait les chaînes de l'utilisateur.
    simule(recupererAbonnements).mockResolvedValue([] as never);
    await actualiser(undefined, true);
    expect(db.enregistrerChaines).not.toHaveBeenCalled();
    expect(reglages.has('derniere_synchro_chaines')).toBe(false);
  });
});

describe('déroulé d’une actualisation', () => {
  it('s’arrête avant les flux quand aucune chaîne n’est connue', async () => {
    simule(db.listerChaines).mockResolvedValue([] as never);
    const bilan = await actualiser();
    expect(bilan).toEqual({ chaines: 0, videos: 0, purgees: 0 });
    expect(recupererFlux).not.toHaveBeenCalled();
    // Rien n'a été relevé : la date de synchronisation ne doit pas être posée.
    expect(reglages.has('derniere_synchro')).toBe(false);
  });

  it('ne consomme pas de quota quand aucune durée ne manque', async () => {
    await actualiser();
    expect(recupererDetails).not.toHaveBeenCalled();
  });

  it('ne demande les durées que des vidéos qui en manquent', async () => {
    simule(db.videosSansDuree).mockResolvedValue(['v1', 'v2'] as never);
    await actualiser();
    expect(recupererDetails).toHaveBeenCalledWith(['v1', 'v2']);
    expect(db.enregistrerDurees).toHaveBeenCalledTimes(1);
  });

  it('purge le cache et date la synchronisation en fin de parcours', async () => {
    simule(db.purgerCache).mockResolvedValue(7 as never);
    const bilan = await actualiser();
    expect(bilan.purgees).toBe(7);
    expect(reglages.has('derniere_synchro')).toBe(true);
  });

  it('rend compte de l’avancement à chaque étape', async () => {
    simule(db.videosSansDuree).mockResolvedValue(['v1'] as never);
    const etapes: string[] = [];
    await actualiser((a) => etapes.push(a.etape), true);
    expect(etapes).toContain('Abonnements');
    expect(etapes).toContain('Nouvelles vidéos');
    expect(etapes).toContain('Durées');
  });
});
