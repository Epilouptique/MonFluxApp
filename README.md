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
`docs/play-store.md`, et l'étude F-Droid dans `docs/f-droid.md`. **Expo Go ne convient
pas pour ce projet** : Google refuse son URL de retour OAuth côté iOS, et il n'embarque
pas le SDK natif exigé côté Android. Il faut un build de développement.

```bat
npm run verifier      :: tsc --noEmit + eslint + jest (56 tests)
npm run lint          :: eslint seul
npm run doctor        :: expo-doctor
node tools/icones.mjs :: régénère les icônes
```

## Deux mécanismes de connexion, par contrainte de Google

Sur iOS, OAuth 2.0 + PKCE dans le navigateur. Sur Android, le SDK natif Google
Sign-In : Google ne prend plus en charge les schémas d'URI personnalisés sur cette
plateforme, ce qui condamne le flux par navigateur. `src/auth.ts` expose la même API
dans les deux cas ; le reste de l'application ignore la différence.

Conséquence pour F-Droid : la dépendance aux services Google Play rend l'application
inéligible à leur dépôt principal, et ouvrir le code n'y change rien. Détails dans
`docs/f-droid.md`.

## Installer sans passer par un magasin

Les APK sont publiés en *release* de ce dépôt. Pour une installation ponctuelle, il
suffit de télécharger le fichier et de l'ouvrir sur l'appareil.

Pour recevoir les mises à jour automatiquement,
[Obtainium](https://github.com/ImranR98/Obtainium) surveille ce dépôt : y ajouter
l'URL `https://github.com/Epilouptique/MonFluxApp`. La marche à suivre côté
publication est dans `docs/distribution-directe.md`.

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

## D'où viennent les données

Deux sources, et l'application le dit à l'utilisateur dans ses réglages :

| Donnée | Source | Conservation |
| --- | --- | --- |
| Liste des abonnements | API YouTube Data | 30 jours |
| Durée et format des vidéos | API YouTube Data | 30 jours |
| Nouvelles vidéos des chaînes | flux RSS publics des chaînes | 30 jours |
| Historique de lecture, « À regarder » | l'utilisateur lui-même | sans limite, local |

Les flux RSS portent l'essentiel du trafic, ce qui maintient la consommation à 1 à
3 unités de quota par ouverture, loin sous le plafond de 10 000 par jour. Les données
venues de YouTube sont effacées de l'appareil au bout de 30 jours, comme l'exigent les
règles de l'API ; les données de lecture sont celles de l'utilisateur et restent sur
l'appareil sans limite de durée. L'analyse complète des règles développeur YouTube,
y compris les points qui restent à faire trancher, est dans `docs/regles-youtube.md`.

## Licence

MIT — voir `LICENSE`. Licence permissive choisie délibérément : la GPL est réputée
incompatible avec les conditions de l'App Store, qui imposent des restrictions d'usage
que le copyleft interdit.

© 2026 Hugo Vial-Jaime — Dahu-Concept
