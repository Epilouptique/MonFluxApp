// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Réglages, atteints par le bouton « … » de l'en-tête. Volontairement nus : les
// filtres d'affichage sont désormais portés par les onglets eux-mêmes, il ne reste
// ici que ce qui est vraiment un réglage.

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEtat } from '../src/etat';
import { derniereSynchro } from '../src/sync';
import { T } from '../src/theme';
import { dateRelative } from '../src/format';

export default function Reglages() {
  const {
    deconnecter,
    actualiser,
    enCours,
    revision,
    erreur,
    lancerDirect,
    changerLancerDirect,
  } = useEtat();
  const router = useRouter();
  const [synchro, setSynchro] = useState<number | null>(null);

  useEffect(() => {
    void (async () => setSynchro(await derniereSynchro()))();
  }, [revision]);

  return (
    <ScrollView style={{ backgroundColor: T.fond }} contentContainerStyle={s.page}>
      <View style={s.ligne}>
        <Text style={s.titre}>Lancer directement</Text>
        <Switch
          value={lancerDirect}
          onValueChange={(v) => void changerLancerDirect(v)}
          trackColor={{ true: T.accent, false: T.trait }}
        />
      </View>

      <Pressable style={s.bouton} disabled={enCours} onPress={() => void actualiser()}>
        <Text style={s.boutonTexte}>
          {enCours ? 'Actualisation…' : 'Actualiser maintenant'}
        </Text>
      </Pressable>
      <Text style={s.discret}>
        {synchro ? `Actualisé ${dateRelative(synchro)}` : 'Jamais actualisé'}
      </Text>

      <Pressable
        style={[s.bouton, s.boutonDanger]}
        onPress={() =>
          Alert.alert(
            'Se déconnecter',
            'Les abonnements, l’historique et la liste « À regarder » seront supprimés de cet appareil.',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Se déconnecter',
                style: 'destructive',
                onPress: () => {
                  void deconnecter();
                  router.back();
                },
              },
            ],
          )
        }
      >
        <Text style={s.boutonTexte}>Se déconnecter</Text>
      </Pressable>

      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}

      {/*
        Les règles développeur YouTube demandent que la différence soit claire pour
        l'utilisateur quand des données d'autres sources sont présentées à côté des
        données de l'API. Le flux les mêle par conception — c'est ce qui économise le
        quota — donc la distinction est énoncée ici, explicitement.
      */}
      <View style={s.section}>
        <Text style={s.titre}>Provenance des données</Text>
        <Text style={s.explication}>
          La liste de vos abonnements et la durée des vidéos viennent de l’API YouTube
          Data. Les vidéos elles-mêmes sont relevées sur les flux RSS publics des
          chaînes, sans passer par l’API.
        </Text>
        <Text style={s.explication}>
          Les données YouTube sont effacées de l’appareil au bout de 30 jours. Votre
          historique de lecture et votre liste « À regarder » sont les vôtres : ils
          restent sur l’appareil et ne sont jamais envoyés ailleurs.
        </Text>
      </View>

      <View style={s.pied}>
        <Text style={s.mention}>Mon Flux {Constants.expoConfig?.version ?? ''}</Text>
        <Text style={s.mention}>Hugo Vial-Jaime — Dahu-Concept</Text>
        <Text style={s.mention}>dahu-concept.fr</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: T.espace, gap: 18, paddingBottom: 40 },
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titre: { color: T.texte, fontSize: 16 },
  bouton: {
    backgroundColor: T.fondCarte,
    paddingVertical: 13,
    borderRadius: T.rayon,
    alignItems: 'center',
  },
  boutonDanger: { backgroundColor: T.accentFaible },
  boutonTexte: { color: T.texte, fontSize: 15, fontWeight: '600' },
  discret: { color: T.texteFaible, fontSize: 12, textAlign: 'center', marginTop: -10 },
  erreur: { color: T.accent, fontSize: 12, textAlign: 'center' },
  section: { gap: 7, borderTopWidth: 1, borderTopColor: T.trait, paddingTop: 16 },
  explication: { color: T.texteFaible, fontSize: 12, lineHeight: 17 },
  pied: { marginTop: 10, gap: 3 },
  mention: { color: T.texteFaible, fontSize: 11, textAlign: 'center' },
});
