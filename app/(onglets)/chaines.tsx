// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Liste des chaînes suivies. Appui : le flux filtré sur cette chaîne. Œil : masquer
// la chaîne du flux principal (filtre local, l'abonnement YouTube n'est pas touché).

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as db from '../../src/db';
import { useEtat } from '../../src/etat';
import { T } from '../../src/theme';
import type { Chaine } from '../../src/types';

export default function Chaines() {
  const { revision, signalerChangement } = useEtat();
  const router = useRouter();
  const [chaines, setChaines] = useState<Chaine[]>([]);

  useEffect(() => {
    void (async () => setChaines(await db.listerChaines()))();
  }, [revision]);

  const basculer = useCallback(
    async (id: string) => {
      await db.basculerMasquage(id);
      signalerChangement();
    },
    [signalerChangement],
  );

  return (
    <FlatList
      style={{ backgroundColor: T.fond }}
      data={chaines}
      keyExtractor={(c) => c.id}
      ListEmptyComponent={
        <Text style={s.vide}>Aucune chaîne. Actualise le flux pour les récupérer.</Text>
      }
      renderItem={({ item }) => (
        <Pressable style={s.ligne} onPress={() => router.push(`/chaine/${item.id}`)}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: T.trait }]} />
          )}
          <Text style={[s.titre, item.masquee === 1 && s.titreMasque]} numberOfLines={1}>
            {item.titre}
          </Text>
          <Pressable onPress={() => void basculer(item.id)} hitSlop={10} style={s.bouton}>
            <Ionicons
              name={item.masquee === 1 ? 'eye-off' : 'eye-outline'}
              size={20}
              color={item.masquee === 1 ? T.accent : T.texteFaible}
            />
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.espace,
    padding: T.espace,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.trait,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  titre: { flex: 1, color: T.texte, fontSize: 15 },
  titreMasque: { color: T.texteFaible },
  bouton: { padding: 4 },
  vide: { color: T.texteFaible, textAlign: 'center', padding: 32 },
});
