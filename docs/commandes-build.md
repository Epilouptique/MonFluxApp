# Construire et installer la version iOS depuis Windows

Aucun Mac n'est nécessaire : tout passe par EAS Build, et le compte Apple Developer
est déjà en place (TestFlight compris).

## Pourquoi pas Expo Go, ici

Expo Go convient pour la plupart des projets, mais pas pour celui-ci : Google refuse
l'URL de retour d'Expo Go (`exp://…`) pour un client OAuth iOS, et le proxy
d'authentification d'Expo n'existe plus depuis le SDK 48. L'application le détecte et
affiche un message explicite au lieu d'un « invalid_request » de Google
(`dansExpoGo()` dans `src/auth.ts`).

Un build de développement remplace Expo Go sans rien changer aux habitudes : il
s'installe une fois, et `npx expo start --dev-client` recharge le JavaScript comme
avant. Il n'y a de rebuild à faire que si une dépendance native change.

## Déjà fait (17/11/2026)

- Projet EAS **@dahuconcept/monflux**, `28c98e4c-9e9d-4620-bdea-11ab3b425532`,
  inscrit en valeur par défaut dans `app.config.js` (configuration dynamique :
  `eas init` ne peut pas l'y écrire lui-même).
- Variable `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` posée sur les trois environnements EAS,
  et en valeur par défaut dans `app.config.js` pour que `npx expo start` fonctionne
  sans préparation.
- `tools\verif-config.bat` confirme que le schéma de retour OAuth dérivé correspond
  au `REVERSED_CLIENT_ID` du fichier fourni par Google.

## Reste à faire, une seule fois, depuis ton terminal

Ces deux étapes demandent ton compte Apple et ton iPhone, elles ne peuvent pas être
automatisées.

```bat
eas device:create     :: enregistre l'iPhone : choisir « Website », puis le QR code
eas credentials       :: facultatif, EAS gère tout seul au premier build
```

## Build de développement (itérations quotidiennes)

Contient le client de développement : le code JavaScript se recharge sans rebuild.
C'est le build à utiliser, car **Expo Go ne convient pas** ici (Google refuse l'URL
de retour OAuth d'Expo Go).

```bat
eas build --platform ios --profile development
```

Installation : le QR code renvoyé par EAS, sur l'iPhone, Safari. L'appareil doit être
enregistré au préalable (`eas device:create`).

Puis, pour chaque modification de code :

```bat
npx expo start --dev-client
```

## Build de test interne (TestFlight)

```bat
eas build --platform ios --profile preview
eas submit --platform ios --latest
```

## Build de production

```bat
eas build --platform ios --profile production
eas submit --platform ios --latest
```

`appVersionSource: remote` : le `buildNumber` est incrémenté par EAS, jamais à la main.
La version affichée (`version` dans `app.config.js`) reste à changer manuellement.

## Vérifications avant chaque build

```bat
npm run verifier      :: tsc --noEmit
npm run doctor        :: expo-doctor
```

## Android

Décision du 17/11/2026 : non construit pour l'instant. `app.config.js` réserve
l'identifiant `fr.dahuconcept.monflux` pour le jour où ce sera utile ; le code n'a
aucune dépendance propre à iOS, hormis le libellé « iPhone » de quelques textes.
