// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Flux principal : toutes les vidéos des abonnements, du plus récent au plus ancien.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ListeVideos from '../../src/composants/ListeVideos';
import { useEtat } from '../../src/etat';
import { T } from '../../src/theme';

export default function Flux() {
  const { reglages, changerReglage } = useEtat();
  return (
    <View style={{ flex: 1, backgroundColor: T.fond }}>
      <View style={s.barre}>
        <Pressable
          style={[s.filtre, reglages.afficherVues && s.filtreActif]}
          onPress={() => void changerReglage('afficherVues', !reglages.afficherVues)}
        >
          <Ionicons
            name={reglages.afficherVues ? 'eye' : 'eye-off'}
            size={14}
            color={reglages.afficherVues ? T.texte : T.texteFaible}
          />
          <Text style={[s.filtreTexte, reglages.afficherVues && s.filtreTexteActif]}>
            {reglages.afficherVues ? 'Tout' : 'Non vues'}
          </Text>
        </Pressable>
        {reglages.afficherShorts ? <Text style={s.note}>Shorts affichés</Text> : null}
      </View>
      <ListeVideos
        messageVide={
          "Rien à afficher pour l'instant. Tire la liste vers le bas pour actualiser."
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.espace,
    paddingHorizontal: T.espace,
    paddingBottom: 8,
  },
  filtre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.trait,
  },
  filtreActif: { backgroundColor: T.fondCarte },
  filtreTexte: { color: T.texteFaible, fontSize: 12 },
  filtreTexteActif: { color: T.texte },
  note: { color: T.texteFaible, fontSize: 11 },
});
