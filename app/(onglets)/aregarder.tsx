// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Vidéos enregistrées pour plus tard. Elles survivent à la purge des 30 jours.

import React from 'react';
import ListeVideos from '../../src/composants/ListeVideos';

export default function ARegarder() {
  return (
    <ListeVideos
      enregistreesSeules
      messageVide={
        'Aucune vidéo enregistrée. Touche le marque-page sur une vignette du flux pour la garder ici.'
      }
    />
  );
}
