// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Flux filtré sur une seule chaîne.

import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import ListeVideos from '../../src/composants/ListeVideos';
import * as db from '../../src/db';

export default function FluxChaine() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [titre, setTitre] = useState('Chaîne');

  useEffect(() => {
    void (async () => {
      const chaines = await db.listerChaines();
      const c = chaines.find((x) => x.id === id);
      if (c) setTitre(c.titre);
    })();
  }, [id]);

  useEffect(() => {
    navigation.setOptions({ title: titre });
  }, [navigation, titre]);

  return <ListeVideos chaineId={id} messageVide="Aucune vidéo récente pour cette chaîne." />;
}
