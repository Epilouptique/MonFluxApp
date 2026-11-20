// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Configuration Expo, prête pour EAS. Toutes les valeurs variables passent par
// l'environnement (voir docs/google-cloud.md et docs/commandes-build.md).

// Identifiant client OAuth « iOS » créé dans Google Cloud Console. Un client iOS n'a pas
// de secret — l'échange de jeton se fait en PKCE depuis l'appareil — et cet identifiant
// est de toute façon embarqué en clair dans l'application : il n'y a rien à protéger ici.
// Il est donc posé en valeur par défaut, pour qu'un « npx expo start » fonctionne sans
// préparer d'environnement. EAS le fournit aussi en variable, qui a la priorité.
const CLIENT_ID_IOS =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '631781454408-blrur2jpjqon057grudqe5necn6rj2tf.apps.googleusercontent.com';

// Client OAuth « Android », distinct du client iOS : Google le lie au nom de paquet et
// à l'empreinte SHA-1 du certificat de signature. Il n'existe pas encore (voir
// docs/google-cloud.md) ; sans lui, l'application se construit et s'installe, mais la
// connexion Google échoue.
const CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

// Identifiant applicatif commun aux deux plateformes. DÉFINITIF après publication :
// le changer revient à publier une nouvelle application.
const IDENTIFIANT = 'fr.dahuconcept.monflux';

// Schéma de redirection OAuth imposé par Google pour un client iOS : l'identifiant client
// inversé. On le déduit du client ID pour éviter de le saisir deux fois.
const SCHEMA_INVERSE = CLIENT_ID_IOS
  ? CLIENT_ID_IOS.split('.').reverse().join('.')
  : '';

module.exports = {
  expo: {
    name: 'Mon Flux',
    slug: 'monflux',
    // Deux schémas : celui de l'application, et le nom de paquet, qui sert d'URL de
    // retour OAuth sur Android. Déclarer le second ici évite d'écrire un filtre
    // d'intention à la main.
    scheme: ['monflux', IDENTIFIANT],
    // Version affichée. Le buildNumber est géré par EAS (appVersionSource « remote » dans
    // eas.json) : app.config.js est dynamique, EAS ne peut pas l'y réécrire.
    version: '1.0.0',
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
      package: IDENTIFIANT,
      // Icône adaptative : Android recompose lui-même la forme (ronde, carrée,
      // en goutte) à partir de l'avant-plan et de l'arrière-plan. La version
      // monochrome sert aux thèmes dynamiques d'Android 13 et suivants.
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
        backgroundColor: '#0E0E10',
      },
      // Thème sombre : l'application n'a pas de mode clair, autant que le système
      // le sache avant même le premier rendu.
      softwareKeyboardLayoutMode: 'pan',
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
      googleAndroidClientId: CLIENT_ID_ANDROID,
      identifiantApplicatif: IDENTIFIANT,
      // Projet EAS @dahuconcept/monflux. L'identifiant n'est pas un secret (il figure
      // dans les builds) ; il est écrit ici parce qu'une configuration dynamique ne
      // peut pas être renseignée automatiquement par « eas init ».
      eas: { projectId: process.env.EAS_PROJECT_ID || '28c98e4c-9e9d-4620-bdea-11ab3b425532' },
    },
    owner: process.env.EXPO_OWNER || 'dahuconcept',
  },
};
