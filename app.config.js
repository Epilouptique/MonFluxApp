// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Configuration Expo, prête pour EAS. Toutes les valeurs variables passent par
// l'environnement (voir docs/google-cloud.md et docs/commandes-build.md).

// Identifiant client OAuth « iOS » créé dans Google Cloud Console. Jamais de secret client :
// un client iOS n'en a pas, l'échange de jeton se fait en PKCE depuis l'appareil.
const CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// Schéma de redirection OAuth imposé par Google pour un client iOS : l'identifiant client
// inversé. On le déduit du client ID pour éviter de le saisir deux fois.
const SCHEMA_INVERSE = CLIENT_ID_IOS
  ? CLIENT_ID_IOS.split('.').reverse().join('.')
  : '';

module.exports = {
  expo: {
    name: 'Mon Flux',
    slug: 'monflux',
    scheme: 'monflux',
    // Version affichée. Le buildNumber est géré par EAS (appVersionSource « remote » dans
    // eas.json) : app.config.js est dynamique, EAS ne peut pas l'y réécrire.
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
      dark: { image: './assets/splash-icon.png', backgroundColor: '#101012' },
    },
    ios: {
      // Identifiant DÉFINITIF après la première publication. Convention Dahu-Concept :
      // fr.dahuconcept.<appli>.
      bundleIdentifier: 'fr.dahuconcept.monflux',
      // v1 : iPhone seulement (évite les captures iPad 13 pouces exigées par Apple).
      supportsTablet: false,
      infoPlist: {
        // Pas de chiffrement propre à l'application (HTTPS du système uniquement).
        ITSAppUsesNonExemptEncryption: false,
        // Schéma de retour OAuth Google. Ajouté seulement si le client ID est fourni,
        // pour qu'un build sans variable d'environnement échoue clairement plutôt que
        // d'embarquer une URL vide.
        CFBundleURLTypes: SCHEMA_INVERSE
          ? [{ CFBundleURLSchemes: [SCHEMA_INVERSE, 'monflux'] }]
          : [{ CFBundleURLSchemes: ['monflux'] }],
      },
    },
    android: {
      // Réservé : la version Android n'est pas construite pour l'instant (décision du 17/11/2026).
      package: 'fr.dahuconcept.monflux',
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.CAMERA',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },
    // expo-font est exigé par @expo/vector-icons (les icônes sont des polices) : sans ce
    // greffon, l'application fonctionne dans Expo Go mais plante dans un build natif.
    plugins: [
      'expo-router',
      'expo-font',
      'expo-sqlite',
      'expo-secure-store',
      'expo-web-browser',
    ],
    experiments: { typedRoutes: true },
    extra: {
      googleIosClientId: CLIENT_ID_IOS,
      // Projet EAS @dahuconcept/monflux. L'identifiant n'est pas un secret (il figure
      // dans les builds) ; il est écrit ici parce qu'une configuration dynamique ne
      // peut pas être renseignée automatiquement par « eas init ».
      eas: { projectId: process.env.EAS_PROJECT_ID || '28c98e4c-9e9d-4620-bdea-11ab3b425532' },
    },
    owner: process.env.EXPO_OWNER || 'dahuconcept',
  },
};
