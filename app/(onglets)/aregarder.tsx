// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Vidéos enregistrées pour plus tard. Elles survivent à la purge des 30 jours.

import React from 'react';
import ListeVideos from '../../src/composants/ListeVideos';

export default function ARegarder() {
  return (
    <ListeVideos
      enregistreesSeules
      afficherShorts
      afficherVues
      messageVide={
        'Aucune vidéo enregistrée. Glisse une vignette vers la droite pour la garder ici.'
      }
    />
  );
}
