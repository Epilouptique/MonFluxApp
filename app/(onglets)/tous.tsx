// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Tout ce qui a été récupéré : vidéos déjà vues et Shorts compris. C'est ici qu'on
// retrouve une vidéo écartée du flux.

import React from 'react';
import ListeVideos from '../../src/composants/ListeVideos';

export default function Tous() {
  return (
    <ListeVideos
      afficherShorts
      afficherVues
      messageVide="Aucune vidéo pour l’instant. Tire la liste vers le bas pour actualiser."
    />
  );
}
