// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// État partagé : session Google, réglages, et déclenchement de l'actualisation.
// Un simple contexte React suffit — pas de bibliothèque d'état pour une application
// à quatre écrans.

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from './auth';
import * as db from './db';
import { actualiser as lancerActualisation, type Avancee } from './sync';
import { REGLAGES_DEFAUT, type Reglages } from './types';

type Contexte = {
  pret: boolean;
  connecte: boolean;
  reglages: Reglages;
  enCours: boolean;
  avancee: Avancee | null;
  erreur: string | null;
  /** Incrémenté à chaque changement de données : les écrans s'y abonnent pour relire. */
  revision: number;
  connecter: () => Promise<void>;
  deconnecter: () => Promise<void>;
  actualiser: () => Promise<void>;
  changerReglage: <C extends keyof Reglages>(cle: C, valeur: Reglages[C]) => Promise<void>;
  signalerChangement: () => void;
};

const Ctx = createContext<Contexte | null>(null);

const CLE_REGLAGES = 'reglages';

export function FournisseurEtat({ children }: { children: React.ReactNode }) {
  const [pret, setPret] = useState(false);
  const [connecte, setConnecte] = useState(false);
  const [reglages, setReglages] = useState<Reglages>(REGLAGES_DEFAUT);
  const [enCours, setEnCours] = useState(false);
  const [avancee, setAvancee] = useState<Avancee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

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

  // Démarrage : ouverture de la base, lecture des réglages, puis actualisation
  // automatique si l'utilisateur est connecté (décision « à l'ouverture + manuellement »).
  useEffect(() => {
    let annule = false;
    (async () => {
      await db.ouvrir();
      const brut = await db.lireReglage(CLE_REGLAGES);
      if (brut) {
        try {
          setReglages({ ...REGLAGES_DEFAUT, ...(JSON.parse(brut) as Partial<Reglages>) });
        } catch {
          // Réglages illisibles : on repart des valeurs par défaut.
        }
      }
      const ok = await auth.estConnecte();
      if (annule) return;
      setConnecte(ok);
      setPret(true);
      if (ok) void actualiser();
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
    reglages,
    enCours,
    avancee,
    erreur,
    revision,
    signalerChangement,
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
      setReglages(REGLAGES_DEFAUT);
      signalerChangement();
    },
    actualiser,
    changerReglage: async (cle, nouvelle) => {
      const suivants = { ...reglages, [cle]: nouvelle };
      setReglages(suivants);
      await db.ecrireReglage(CLE_REGLAGES, JSON.stringify(suivants));
      signalerChangement();
    },
  };

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useEtat(): Contexte {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEtat doit être utilisé dans FournisseurEtat.');
  return c;
}
