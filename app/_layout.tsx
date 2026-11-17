// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FournisseurEtat, useEtat } from '../src/etat';
import { T } from '../src/theme';
import Connexion from '../src/composants/Connexion';

function Racine() {
  const { pret, connecte } = useEtat();
  if (!pret) {
    return (
      <View style={{ flex: 1, backgroundColor: T.fond, justifyContent: 'center' }}>
        <ActivityIndicator color={T.texteFaible} />
      </View>
    );
  }
  // Pas de route de connexion : tant qu'aucun compte Google n'est lié, l'application
  // n'a rien à afficher d'autre.
  if (!connecte) return <Connexion />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: T.fond },
        headerTintColor: T.texte,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: T.fond },
      }}
    >
      <Stack.Screen name="(onglets)" options={{ headerShown: false }} />
      <Stack.Screen name="video/[id]" options={{ title: '', presentation: 'card' }} />
      <Stack.Screen name="chaine/[id]" options={{ title: 'Chaîne' }} />
    </Stack>
  );
}

export default function Disposition() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <FournisseurEtat>
        <Racine />
      </FournisseurEtat>
    </SafeAreaProvider>
  );
}
