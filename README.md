# Mon Flux

Lecteur de flux pour les abonnements YouTube, sur iPhone et Android. Les nouvelles
vidéos des chaînes suivies, dans l'ordre chronologique : pas de recommandations, pas
de page d'accueil, pas de Shorts sauf si on les demande.

Expo SDK 58 · React Native · TypeScript · expo-router · SQLite local · aucun serveur.

## Démarrer

```powershell
npm install
$env:EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="...apps.googleusercontent.com"
npx expo start --dev-client
```

La création des identifiants Google est décrite dans `docs/google-cloud.md`, les
commandes de build dans `docs/commandes-build.md`, la fiche App Store dans
`docs/app-store.md`, la fiche Play Store et le piège des signatures dans
`docs/play-store.md`, et l'étude F-Droid dans `docs/f-droid.md`. **Expo Go ne convient pas pour ce
projet** : Google refuse son URL de retour OAuth. Il faut un build de développement.

```bat
npm run verifier      :: tsc --noEmit + jest
npm run doctor        :: expo-doctor
node tools/icones.mjs :: régénère les icônes
```

## Valider la faisabilité sans iPhone

```powershell
$env:SONDE_CLIENT_ID="..."
$env:SONDE_CLIENT_SECRET="..."
npm run sonde
```

La sonde parcourt toute la chaîne — connexion Google, abonnements, flux RSS, durées —
et affiche le coût réel en quota.

## Écrans

| Onglet | Contenu |
| --- | --- |
| La totale | Tout ce qui a été récupéré, déjà vu et Shorts compris. |
| À regarder | Vidéos enregistrées pour plus tard. |
| Flux | Au centre, sous l'icône : ce qui reste à voir. Ni vues, ni Shorts. |
| Les Shorts | Les Shorts, isolés du flux. |
| Mes abonnements | Chaînes suivies, avec recherche, flux par chaîne, masquage. |

Les réglages sont derrière le bouton « ⋯ » de l'en-tête. Glisser une vignette vers la
droite l'enregistre, vers la gauche la marque comme vue.

## Ce que fait l'application, et ce qu'elle ne fait pas

Lecture seule des abonnements. Historique de lecture gardé sur l'appareil, jamais
envoyé à YouTube. Les vidéos sont lues dans le lecteur officiel YouTube, intact. Pas de
notifications, pas de téléchargement, pas de lecture en arrière-plan, pas de
synchronisation entre appareils.

© Hugo Vial-Jaime — Dahu-Concept. Tous droits réservés.
