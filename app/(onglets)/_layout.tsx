// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Cinq espaces, sans libellés. L'ordre place le flux au centre, sous l'icône de
// l'application : c'est l'écran par défaut, celui qui ne montre que ce qui reste à voir.
// Les réglages ne sont plus un onglet mais un bouton dans l'en-tête : on y va rarement.

import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/theme';

function BoutonReglages() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/reglages')}
      hitSlop={12}
      style={s.reglages}
      accessibilityLabel="Réglages"
      accessibilityRole="button"
    >
      <Ionicons name="ellipsis-horizontal" size={22} color={T.texte} />
    </Pressable>
  );
}

export default function Onglets() {
  // Android dessine désormais sous la barre de navigation système : sans cette marge,
  // les icônes se retrouvent derrière la barre de gestes. Sur iPhone, l'encoche du bas
  // produit le même besoin, avec une autre valeur.
  const marges = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: T.fond },
        headerTintColor: T.texte,
        headerShadowVisible: false,
        headerRight: () => <BoutonReglages />,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: T.fond,
          borderTopColor: T.trait,
          height: 64 + marges.bottom,
          paddingTop: 10,
          paddingBottom: marges.bottom,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarActiveTintColor: T.texte,
        tabBarInactiveTintColor: T.texteFaible,
        sceneStyle: { backgroundColor: T.fond },
      }}
    >
      <Tabs.Screen
        name="tous"
        options={{
          title: 'La totale',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="aregarder"
        options={{
          title: 'À regarder',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mon Flux',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/icon.png')}
              style={[s.icone, !focused && s.iconeInactive]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          title: 'Les Shorts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="phone-portrait-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chaines"
        options={{
          title: 'Mes abonnements',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  reglages: { paddingHorizontal: T.espace },
  // Plus grande que les pictogrammes voisins : c'est l'écran principal, et une image
  // pleine paraît plus petite qu'un trait à dimensions égales.
  icone: { width: 38, height: 38, borderRadius: 9 },
  iconeInactive: { opacity: 0.45 },
});
