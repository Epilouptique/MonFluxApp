// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Le flux : ce qui reste à voir. Ni les vidéos déjà vues, ni les Shorts — c'est la
// logique d'un lecteur de flux, la liste se vide à mesure qu'on la consulte.

import React from 'react';
import ListeVideos from '../../src/composants/ListeVideos';

export default function Flux() {
  return (
    <ListeVideos
      messageVide={
        'Tout est à jour. Les nouvelles vidéos apparaîtront ici ; tire la liste vers le bas pour vérifier.'
      }
    />
  );
}
