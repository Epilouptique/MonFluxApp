// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Liste chronologique réutilisée par le flux, le filtre par chaîne et « À regarder ».

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as db from '../db';
import { useEtat } from '../etat';
import { T } from '../theme';
import type { VideoAffichee } from '../types';
import VignetteVideo from './VignetteVideo';

type Props = {
  chaineId?: string;
  enregistreesSeules?: boolean;
  messageVide: string;
};

export default function ListeVideos({ chaineId, enregistreesSeules, messageVide }: Props) {
  const { reglages, revision, enCours, avancee, erreur, actualiser, signalerChangement } =
    useEtat();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoAffichee[]>([]);
  const [charge, setCharge] = useState(false);

  const relire = useCallback(async () => {
    setVideos(
      await db.listerFlux({
        afficherShorts: reglages.afficherShorts,
        afficherVues: reglages.afficherVues,
        chaineId,
        enregistreesSeules,
      }),
    );
    setCharge(true);
  }, [reglages.afficherShorts, reglages.afficherVues, chaineId, enregistreesSeules]);

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

  return (
    <View style={s.conteneur}>
      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}
      {enCours && avancee ? (
        <Text style={s.avancee}>
          {avancee.etape}
          {avancee.total ? ` ${avancee.faits ?? 0}/${avancee.total}` : '…'}
        </Text>
      ) : null}
      <FlatList
        data={videos}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => (
          <VignetteVideo
            video={item}
            onOuvrir={() => router.push(`/video/${item.id}`)}
            onEnregistrer={() => void basculerEnregistrement(item.id)}
          />
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
        removeClippedSubviews
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
  avancee: {
    color: T.texteFaible,
    paddingHorizontal: T.espace,
    paddingVertical: 6,
    fontSize: 12,
  },
});
