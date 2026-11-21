// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// État partagé : session Google et déclenchement de l'actualisation. Les filtres
// d'affichage ne sont plus ici : chaque onglet déclare ce qu'il montre, il n'y a donc
// plus de réglage global susceptible de le contredire.

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from './auth';
import * as db from './db';
import { actualiser as lancerActualisation, type Avancee } from './sync';

/** Clé du seul réglage restant : les filtres d'affichage sont portés par les onglets. */
const CLE_LANCER_DIRECT = 'lancer_direct';

type Contexte = {
  pret: boolean;
  connecte: boolean;
  /** Toucher une vignette lance la lecture et le plein écran sans étape intermédiaire. */
  lancerDirect: boolean;
  changerLancerDirect: (valeur: boolean) => Promise<void>;
  enCours: boolean;
  avancee: Avancee | null;
  erreur: string | null;
  /** Incrémenté à chaque changement de données : les écrans s'y abonnent pour relire. */
  revision: number;
  connecter: () => Promise<void>;
  deconnecter: () => Promise<void>;
  actualiser: () => Promise<void>;
  signalerChangement: () => void;
};

const Ctx = createContext<Contexte | null>(null);

export function FournisseurEtat({ children }: { children: React.ReactNode }) {
  const [pret, setPret] = useState(false);
  const [connecte, setConnecte] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [avancee, setAvancee] = useState<Avancee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [lancerDirect, setLancerDirect] = useState(true);

  const signalerChangement = useCallback(() => setRevision((r) => r + 1), []);

  const actualiser = useCallback(async () => {
    setEnCours(true);
    setErreur(null);
    try {
      await lancerActualisation(setAvancee);
      signalerChangement();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message === 'NON_CONNECTE') {
        setConnecte(false);
        setErreur('Session Google expirée : reconnecte-toi.');
      } else if (message === 'QUOTA_DEPASSE') {
        setErreur("Quota YouTube atteint pour aujourd'hui. Le flux déjà chargé reste lisible.");
      } else {
        setErreur(message);
      }
    } finally {
      setEnCours(false);
      setAvancee(null);
    }
  }, [signalerChangement]);

  // Démarrage : ouverture de la base, puis actualisation automatique si l'utilisateur
  // est connecté (décision « à l'ouverture + manuellement »).
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        await db.ouvrir();
        // Activé par défaut : toucher une vidéo pour la regarder est le geste attendu,
        // le double appui actuel est une étape de trop.
        const direct = await db.lireReglage(CLE_LANCER_DIRECT);
        const ok = await auth.estConnecte();
        if (annule) return;
        setLancerDirect(direct == null ? true : direct === '1');
        setConnecte(ok);
        setPret(true);
        if (ok) void actualiser();
      } catch (e) {
        // Sans ce filet, la moindre panne au démarrage laisse « pret » à false et
        // l'application reste sur un écran vide, sans le moindre message : le pire
        // des symptômes, puisqu'il ne dit rien de sa cause.
        if (annule) return;
        setErreur(
          `Démarrage incomplet : ${e instanceof Error ? e.message : String(e)}`,
        );
        setPret(true);
      }
    })();
    return () => {
      annule = true;
    };
    // Volontairement au montage seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valeur: Contexte = {
    pret,
    connecte,
    enCours,
    avancee,
    erreur,
    revision,
    lancerDirect,
    signalerChangement,
    changerLancerDirect: async (valeur) => {
      setLancerDirect(valeur);
      try {
        await db.ecrireReglage(CLE_LANCER_DIRECT, valeur ? '1' : '0');
      } catch (e) {
        setLancerDirect(!valeur);
        setErreur(`Réglage non enregistré : ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    connecter: async () => {
      setErreur(null);
      try {
        await auth.connecter();
        setConnecte(true);
        await actualiser();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    deconnecter: async () => {
      await auth.deconnecter();
      await db.toutEffacer();
      setConnecte(false);
      signalerChangement();
    },
    actualiser,
  };

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useEtat(): Contexte {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEtat doit être utilisé dans FournisseurEtat.');
  return c;
}
