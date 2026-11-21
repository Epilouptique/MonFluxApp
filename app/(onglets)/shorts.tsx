// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Les Shorts, isolés : ils n'encombrent plus le flux mais restent accessibles quand
// c'est ce qu'on cherche.

import React from 'react';
import ListeVideos from '../../src/composants/ListeVideos';

export default function Shorts() {
  return (
    <ListeVideos
      shortsSeuls
      afficherVues
      messageVide="Aucun Short dans les vidéos récupérées."
    />
  );
}
