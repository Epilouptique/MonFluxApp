// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept

import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useEtat } from '../../src/etat';
import { derniereSynchro } from '../../src/sync';
import { SEUIL_SHORT_S } from '../../src/youtube';
import { T } from '../../src/theme';
import { dateRelative } from '../../src/format';

export default function Reglages() {
  const { reglages, changerReglage, deconnecter, actualiser, enCours, revision } = useEtat();
  const [synchro, setSynchro] = useState<number | null>(null);

  useEffect(() => {
    void (async () => setSynchro(await derniereSynchro()))();
  }, [revision]);

  return (
    <ScrollView style={{ backgroundColor: T.fond }} contentContainerStyle={s.page}>
      <Text style={s.section}>Affichage</Text>
      <View style={s.ligne}>
        <View style={s.libelle}>
          <Text style={s.titre}>Afficher les Shorts</Text>
          <Text style={s.aide}>
            Détectés par leur durée ({SEUIL_SHORT_S / 60} min ou moins). L’API YouTube ne
            fournit pas d’indicateur fiable : quelques vidéos très courtes peuvent être
            classées à tort.
          </Text>
        </View>
        <Switch
          value={reglages.afficherShorts}
          onValueChange={(v) => void changerReglage('afficherShorts', v)}
          trackColor={{ true: T.accent, false: T.trait }}
        />
      </View>
      <View style={s.ligne}>
        <View style={s.libelle}>
          <Text style={s.titre}>Afficher les vidéos déjà vues</Text>
          <Text style={s.aide}>
            Désactivé, le flux ne montre que les nouveautés. Les vidéos vues restent
            accessibles en réactivant ce réglage.
          </Text>
        </View>
        <Switch
          value={reglages.afficherVues}
          onValueChange={(v) => void changerReglage('afficherVues', v)}
          trackColor={{ true: T.accent, false: T.trait }}
        />
      </View>

      <Text style={s.section}>Actualisation</Text>
      <Text style={s.aide}>
        À chaque ouverture de l’application et en tirant la liste vers le bas. Aucune
        synchronisation en arrière-plan, aucune notification.
      </Text>
      <Text style={s.aide}>
        Dernière actualisation : {synchro ? dateRelative(synchro) : 'jamais'}.
      </Text>
      <Pressable
        style={s.bouton}
        disabled={enCours}
        onPress={() => void actualiser()}
      >
        <Text style={s.boutonTexte}>{enCours ? 'En cours…' : 'Actualiser maintenant'}</Text>
      </Pressable>

      <Text style={s.section}>Compte</Text>
      <Text style={s.aide}>
        Se déconnecter révoque l’accès côté Google et supprime de cet iPhone les
        abonnements, le cache des vidéos, l’historique de lecture et la liste
        « À regarder ».
      </Text>
      <Pressable
        style={[s.bouton, s.boutonDanger]}
        onPress={() =>
          Alert.alert(
            'Se déconnecter',
            'Toutes les données locales seront supprimées, y compris l’historique et « À regarder ». Continuer ?',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Se déconnecter',
                style: 'destructive',
                onPress: () => void deconnecter(),
              },
            ],
          )
        }
      >
        <Text style={s.boutonTexte}>Se déconnecter</Text>
      </Pressable>

      <Text style={s.section}>À propos</Text>
      <Text style={s.aide}>
        Mon Flux {Constants.expoConfig?.version ?? ''} — Hugo Vial-Jaime, Dahu-Concept.
      </Text>
      <Text style={s.aide}>
        Les vidéos sont lues dans le lecteur officiel YouTube, avec ses commandes, ses
        liens et ses publicités éventuelles. Les métadonnées récupérées depuis l’API sont
        effacées au bout de 30 jours, conformément à ses règles d’utilisation.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: T.espace, gap: T.espace, paddingBottom: 48 },
  section: {
    color: T.texteFaible,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
  },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: T.espace },
  libelle: { flex: 1, gap: 4 },
  titre: { color: T.texte, fontSize: 15 },
  aide: { color: T.texteFaible, fontSize: 12, lineHeight: 18 },
  bouton: {
    backgroundColor: T.fondCarte,
    paddingVertical: 12,
    borderRadius: T.rayon,
    alignItems: 'center',
  },
  boutonDanger: { backgroundColor: T.accentFaible },
  boutonTexte: { color: T.texte, fontSize: 15, fontWeight: '600' },
});
