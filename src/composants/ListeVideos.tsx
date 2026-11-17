// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Liste chronologique partagée par tous les onglets. Chaque onglet déclare lui-même
// ce qu'il montre : il n'y a plus de réglage global d'affichage qui viendrait le
// contredire.

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as db from '../db';
import { useEtat } from '../etat';
import { T } from '../theme';
import type { VideoAffichee } from '../types';
import VignetteVideo from './VignetteVideo';
import VignetteGlissante from './VignetteGlissante';

type Props = {
  afficherShorts?: boolean;
  afficherVues?: boolean;
  shortsSeuls?: boolean;
  chaineId?: string;
  enregistreesSeules?: boolean;
  messageVide: string;
};

export default function ListeVideos({
  afficherShorts = false,
  afficherVues = false,
  shortsSeuls,
  chaineId,
  enregistreesSeules,
  messageVide,
}: Props) {
  // L'avancée de la synchronisation n'est volontairement pas affichée : elle se
  // produit à chaque ouverture et n'appelle aucune décision de l'utilisateur.
  const { revision, enCours, erreur, actualiser, signalerChangement } = useEtat();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoAffichee[]>([]);
  const [charge, setCharge] = useState(false);

  const relire = useCallback(async () => {
    setVideos(
      await db.listerFlux({
        afficherShorts,
        afficherVues,
        shortsSeuls,
        chaineId,
        enregistreesSeules,
      }),
    );
    setCharge(true);
  }, [afficherShorts, afficherVues, shortsSeuls, chaineId, enregistreesSeules]);

  useEffect(() => {
    void relire();
  }, [relire, revision]);

  const basculerEnregistrement = useCallback(
    async (id: string) => {
      await db.basculerEnregistrement(id);
      signalerChangement();
    },
    [signalerChangement],
  );

  const basculerVue = useCallback(
    async (video: VideoAffichee) => {
      await db.marquerVue(video.id, video.vueLe == null);
      signalerChangement();
    },
    [signalerChangement],
  );

  return (
    <View style={s.conteneur}>
      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}
      <FlatList
        data={videos}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => (
          <VignetteGlissante
            enregistree={item.enregistreeLe != null}
            vue={item.vueLe != null}
            onEnregistrer={() => void basculerEnregistrement(item.id)}
            onMarquerVue={() => void basculerVue(item)}
          >
            <VignetteVideo
              video={item}
              onOuvrir={() => router.push(`/video/${item.id}`)}
              onEnregistrer={() => void basculerEnregistrement(item.id)}
            />
          </VignetteGlissante>
        )}
        refreshControl={
          <RefreshControl
            refreshing={enCours}
            onRefresh={() => void actualiser()}
            tintColor={T.texteFaible}
          />
        }
        ListEmptyComponent={
          charge && !enCours ? <Text style={s.vide}>{messageVide}</Text> : <></>
        }
        initialNumToRender={10}
        windowSize={7}
      />
    </View>
  );
}

const s = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: T.fond },
  vide: { color: T.texteFaible, textAlign: 'center', padding: 32, lineHeight: 21 },
  erreur: {
    color: T.texte,
    backgroundColor: T.accentFaible,
    padding: T.espace,
    fontSize: 13,
  },
});
