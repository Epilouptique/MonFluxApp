// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
//
// Les appels à l'API YouTube sont l'endroit où une erreur coûte cher : un quota épuisé
// ou une session perdue doivent être distingués d'une panne ordinaire, et le réessai
// sur 401 ne doit jamais boucler.

jest.mock('../src/auth', () => ({
  jetonAcces: jest.fn(),
  invaliderJetonAcces: jest.fn(),
}));

import { invaliderJetonAcces, jetonAcces } from '../src/auth';
import { recupererAbonnements, recupererDetails } from '../src/youtube';

const jetonSimule = jetonAcces as jest.MockedFunction<typeof jetonAcces>;
const invalidationSimulee = invaliderJetonAcces as jest.MockedFunction<
  typeof invaliderJetonAcces
>;

/** Réponse HTTP minimale, suffisante pour ce que le module en lit. */
function reponse(corps: unknown, statut = 200): Response {
  return {
    ok: statut >= 200 && statut < 300,
    status: statut,
    json: async () => corps,
    text: async () => (typeof corps === 'string' ? corps : JSON.stringify(corps)),
  } as Response;
}

let appels: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jetonSimule.mockResolvedValue('jeton-valide');
  appels = jest.fn();
  globalThis.fetch = appels as unknown as typeof fetch;
});

describe('gestion des erreurs de l’API', () => {
  it('distingue le quota épuisé d’une erreur quelconque', async () => {
    appels.mockResolvedValue(reponse('{"error":{"errors":[{"reason":"quotaExceeded"}]}}', 403));
    await expect(recupererAbonnements()).rejects.toThrow('QUOTA_DEPASSE');
  });

  it('réessaie une fois après un 401, après avoir jeté le jeton', async () => {
    // Le SDK Android sert un jeton depuis son cache sans vérifier qu'il est valide :
    // un 401 ne veut donc pas dire que la session est perdue.
    appels
      .mockResolvedValueOnce(reponse('jeton périmé', 401))
      .mockResolvedValueOnce(reponse({ items: [] }));

    await expect(recupererAbonnements()).resolves.toEqual([]);
    expect(invalidationSimulee).toHaveBeenCalledTimes(1);
    expect(appels).toHaveBeenCalledTimes(2);
  });

  it('abandonne après un second 401 plutôt que de boucler', async () => {
    appels.mockResolvedValue(reponse('toujours refusé', 401));

    await expect(recupererAbonnements()).rejects.toThrow('NON_CONNECTE');
    // Deux appels exactement : la garde contre la boucle infinie tient.
    expect(appels).toHaveBeenCalledTimes(2);
    expect(invalidationSimulee).toHaveBeenCalledTimes(1);
  });

  it('remonte les autres erreurs avec leur code', async () => {
    appels.mockResolvedValue(reponse('panne serveur', 500));
    await expect(recupererAbonnements()).rejects.toThrow('API YouTube 500');
  });
});

describe('récupération des abonnements', () => {
  it('suit la pagination et retient le meilleur avatar disponible', async () => {
    appels
      .mockResolvedValueOnce(
        reponse({
          nextPageToken: 'page2',
          items: [
            {
              snippet: {
                title: 'Chaîne A',
                resourceId: { channelId: 'UC_A' },
                thumbnails: { default: { url: 'a-petit' }, medium: { url: 'a-moyen' } },
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        reponse({
          items: [
            {
              snippet: {
                title: 'Chaîne B',
                resourceId: { channelId: 'UC_B' },
                thumbnails: { medium: { url: 'b-moyen' } },
              },
            },
          ],
        }),
      );

    const chaines = await recupererAbonnements();

    expect(chaines).toEqual([
      { id: 'UC_A', titre: 'Chaîne A', avatar: 'a-petit' },
      { id: 'UC_B', titre: 'Chaîne B', avatar: 'b-moyen' },
    ]);
    // La seconde requête doit porter le jeton de page, sans quoi on relirait la
    // première page indéfiniment.
    expect(String(appels.mock.calls[1][0])).toContain('pageToken=page2');
  });

  it('accepte une chaîne sans vignette', async () => {
    appels.mockResolvedValueOnce(
      reponse({ items: [{ snippet: { title: 'Sans image', resourceId: { channelId: 'UC_C' } } }] }),
    );
    await expect(recupererAbonnements()).resolves.toEqual([
      { id: 'UC_C', titre: 'Sans image', avatar: null },
    ]);
  });

  it('s’arrête au garde-fou si l’API renvoie toujours une page suivante', async () => {
    appels.mockResolvedValue(reponse({ nextPageToken: 'encore', items: [] }));
    await expect(recupererAbonnements()).resolves.toEqual([]);
    expect(appels).toHaveBeenCalledTimes(20);
  });
});

describe('récupération des détails de vidéos', () => {
  it('interroge l’API par lots de 50', async () => {
    const ids = Array.from({ length: 120 }, (_, i) => `v${i}`);
    appels.mockResolvedValue(reponse({ items: [] }));

    await recupererDetails(ids);

    expect(appels).toHaveBeenCalledTimes(3);
    expect(String(appels.mock.calls[0][0])).toContain('maxHeight=720');
  });

  it('marque à 0 les vidéos que l’API ne renvoie pas', async () => {
    // Vidéo supprimée ou passée en privé depuis sa parution dans le flux RSS : sans
    // cette marque, elle serait redemandée à chaque synchronisation.
    appels.mockResolvedValueOnce(
      reponse({
        items: [
          {
            id: 'presente',
            contentDetails: { duration: 'PT10M' },
            player: { embedHtml: '<iframe width="1280" height="720"></iframe>' },
          },
        ],
      }),
    );

    const details = await recupererDetails(['presente', 'disparue']);

    expect(details).toContainEqual({ id: 'presente', dureeS: 600, estShort: 0 });
    expect(details).toContainEqual({ id: 'disparue', dureeS: 0, estShort: 0 });
  });

  it('reconnaît un Short à sa durée et à son format', async () => {
    appels.mockResolvedValueOnce(
      reponse({
        items: [
          {
            id: 'court',
            contentDetails: { duration: 'PT45S' },
            player: { embedHtml: '<iframe width="405" height="720"></iframe>' },
          },
        ],
      }),
    );
    await expect(recupererDetails(['court'])).resolves.toEqual([
      { id: 'court', dureeS: 45, estShort: 1 },
    ]);
  });

  it('ne demande rien quand la liste est vide', async () => {
    await expect(recupererDetails([])).resolves.toEqual([]);
    expect(appels).not.toHaveBeenCalled();
  });
});
