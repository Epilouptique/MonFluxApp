// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Quatre espaces, comme décidé au cahier des charges : Flux, Chaînes, À regarder,
// Réglages. L'historique des vidéos vues est un filtre du flux, pas un cinquième onglet.

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/theme';

export default function Onglets() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: T.fond },
        headerTintColor: T.texte,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: T.fond, borderTopColor: T.trait },
        tabBarActiveTintColor: T.texte,
        tabBarInactiveTintColor: T.texteFaible,
        sceneStyle: { backgroundColor: T.fond },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Flux',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chaines"
        options={{
          title: 'Chaînes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color as string} size={size} />
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
        name="reglages"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
