// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Liste des chaînes suivies, avec recherche : à 161 abonnements, faire défiler n'est
// plus une option. Appui : le flux filtré sur cette chaîne. Œil : masquer la chaîne du
// flux (filtre local, l'abonnement YouTube n'est pas touché).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as db from '../../src/db';
import { useEtat } from '../../src/etat';
import { T } from '../../src/theme';
import type { Chaine } from '../../src/types';

/** Compare sans tenir compte des accents ni de la casse. */
function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function Chaines() {
  const { revision, signalerChangement } = useEtat();
  const router = useRouter();
  const [chaines, setChaines] = useState<Chaine[]>([]);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    void (async () => setChaines(await db.listerChaines()))();
  }, [revision]);

  const visibles = useMemo(() => {
    const q = normaliser(recherche.trim());
    if (!q) return chaines;
    return chaines.filter((c) => normaliser(c.titre).includes(q));
  }, [chaines, recherche]);

  const basculer = useCallback(
    async (id: string) => {
      await db.basculerMasquage(id);
      signalerChangement();
    },
    [signalerChangement],
  );

  return (
    <View style={s.page}>
      <View style={s.barre}>
        <Ionicons name="search" size={16} color={T.texteFaible} />
        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher une chaîne"
          placeholderTextColor={T.texteFaible}
          style={s.champ}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={visibles}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={s.vide}>
            {chaines.length === 0
              ? 'Aucune chaîne. Actualise le flux pour les récupérer.'
              : 'Aucune chaîne ne correspond.'}
          </Text>
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
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.fond },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: T.espace,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: T.rayon,
    backgroundColor: T.fondCarte,
  },
  champ: { flex: 1, color: T.texte, fontSize: 15, padding: 0 },
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
