// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
//
// Connexion Google, par deux chemins différents selon la plateforme. Ce n'est pas un
// choix d'architecture mais une contrainte de Google, découverte le 21/11/2026 en
// testant sur un appareil Android.
//
//   iOS     : OAuth 2.0 + PKCE dans le navigateur (expo-auth-session), retour par un
//             schéma d'URI personnalisé. Aucun secret client, aucun serveur à nous.
//             Le jeton de rafraîchissement est conservé dans le Trousseau.
//
//   Android : SDK natif Google Sign-In. Google a cessé de prendre en charge les
//             schémas d'URI personnalisés sur Android — il les juge vulnérables à
//             l'usurpation d'application — et l'option qui permettait de les
//             réactiver a disparu de la console. Le flux par navigateur y répond
//             désormais « 400 invalid_request ». Le SDK natif s'authentifie par le
//             couple nom de paquet + empreinte de signature, sans URL de retour, et
//             gère lui-même le cycle de vie des jetons : rien à stocker de notre côté.
//
// L'API publique de ce module est identique pour les deux : estConnecte, connecter,
// jetonAcces, deconnecter. Le reste de l'application ignore cette différence.

import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const CLE_RAFRAICHISSEMENT = 'google_refresh_token';
const ANDROID = Platform.OS === 'android';

/** Lecture seule des abonnements et des vidéos : rien d'autre n'est demandé. */
export const PORTEES = ['https://www.googleapis.com/auth/youtube.readonly'];

export const DECOUVERTE: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

type Extra = {
  googleIosClientId?: string;
  googleAndroidClientId?: string;
  googleWebClientId?: string;
  identifiantApplicatif?: string;
};

function extra(): Extra {
  return (Constants.expoConfig?.extra as Extra | undefined) ?? {};
}

/**
 * Chaque plateforme a son propre client OAuth chez Google : un client « iOS » et un
 * client « Android », liés respectivement à l'identifiant de bundle et au couple
 * nom de paquet + empreinte de signature. Il n'existe pas de client commun.
 *
 * Sur Android, l'identifiant n'est pas passé au SDK : celui-ci retrouve le bon client
 * à partir de la signature de l'application. Il reste vérifié au démarrage, parce
 * qu'un client manquant côté Google produit une erreur native opaque.
 */
export function clientId(): string {
  const e = extra();
  const id = ANDROID ? e.googleAndroidClientId : e.googleIosClientId;
  if (!id) {
    throw new Error(
      ANDROID
        ? "Identifiant client Google Android absent : renseigne EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (voir docs/google-cloud.md)."
        : "Identifiant client Google iOS absent : renseigne EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (voir docs/google-cloud.md).",
    );
  }
  return id;
}

/**
 * URL de retour du flux iOS, suivie d'une SEULE barre oblique : l'identifiant client
 * inversé, com.googleusercontent.apps.X:/oauthredirect.
 *
 * Passer { scheme, path } construirait « X://oauthredirect » — deux barres — que Google
 * refuse avec un « 400 invalid_request » parfaitement opaque. L'option « native »
 * transmet l'URL telle quelle ; c'est aussi ce que fait le fournisseur Google officiel
 * d'expo-auth-session.
 *
 * Sans objet sur Android, où le SDK natif n'utilise aucune URL de retour.
 */
export function uriRetour(): string {
  const inverse = clientId().split('.').reverse().join('.');
  return AuthSession.makeRedirectUri({ native: `${inverse}:/oauthredirect` });
}

/**
 * Expo Go est inutilisable ici, sur les deux plateformes : son URL de retour (exp://…)
 * n'est pas acceptée par Google côté iOS, et il n'embarque pas le SDK natif côté
 * Android. Mieux vaut le dire franchement que laisser échouer plus loin.
 */
export function dansExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

const ERREUR_EXPO_GO =
  'La connexion Google ne fonctionne pas dans Expo Go. Il faut un build de développement, voir docs/commandes-build.md.';

// —————————————————————————— Android : SDK natif ——————————————————————————

let configure = false;

/**
 * Le webClientId sert d'audience au jeton d'identité ; il ne donne accès à rien par
 * lui-même, et le code secret du client Web n'est ni utilisé ni embarqué.
 *
 * `configure` rend la main immédiatement mais prépare le module en arrière-plan, et
 * les appels synchrones du SDK (`hasPreviousSignIn`, `getCurrentUser`) échouent s'ils
 * le devancent. On l'appelle donc dès le chargement du module, bien avant le premier
 * écran, plutôt qu'au premier usage.
 */
function preparerAndroid(): void {
  if (configure) return;
  GoogleSignin.configure({
    scopes: PORTEES,
    webClientId: extra().googleWebClientId,
  });
  configure = true;
}

if (ANDROID) preparerAndroid();

// ——————————————————————————— iOS : navigateur ————————————————————————————

/** Jeton d'accès en mémoire : court (≈1 h), jamais écrit sur le disque. */
let acces: { jeton: string; expireLe: number } | null = null;

// —————————————————————————————— API commune ——————————————————————————————

/**
 * Appelée au tout premier rendu : elle ne doit jamais lever. Un échec ici veut dire
 * « pas de session utilisable », pas « l'application ne démarre pas ».
 */
export async function estConnecte(): Promise<boolean> {
  if (ANDROID) {
    preparerAndroid();
    try {
      return GoogleSignin.hasPreviousSignIn();
    } catch {
      return false;
    }
  }
  try {
    return (await SecureStore.getItemAsync(CLE_RAFRAICHISSEMENT)) !== null;
  } catch {
    return false;
  }
}

/** Demande l'accord de l'utilisateur et ouvre la session. */
export async function connecter(): Promise<void> {
  if (dansExpoGo()) throw new Error(ERREUR_EXPO_GO);

  if (ANDROID) {
    preparerAndroid();
    // Sans les services Google Play, le SDK échoue par une exception native peu
    // lisible : autant poser la question d'abord et proposer la mise à jour.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const resultat = await GoogleSignin.signIn();
    if (resultat.type !== 'success') throw new Error('Connexion annulée.');
    return;
  }

  // Tracé dans les journaux Metro : c'est la valeur que Google compare à sa liste,
  // et la seule façon de diagnostiquer un « invalid_request » sans deviner.
  console.log('[auth] URL de retour :', uriRetour());
  const requete = new AuthSession.AuthRequest({
    clientId: clientId(),
    scopes: PORTEES,
    redirectUri: uriRetour(),
    usePKCE: true,
    // Indispensable pour obtenir un jeton de rafraîchissement : sans lui, il faudrait
    // se reconnecter à chaque heure.
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });
  const resultat = await requete.promptAsync(DECOUVERTE);
  if (resultat.type !== 'success' || !resultat.params.code) {
    throw new Error(
      resultat.type === 'dismiss' || resultat.type === 'cancel'
        ? 'Connexion annulée.'
        : `Connexion refusée (${resultat.type}).`,
    );
  }
  const jetons = await AuthSession.exchangeCodeAsync(
    {
      clientId: clientId(),
      code: resultat.params.code,
      redirectUri: uriRetour(),
      extraParams: { code_verifier: requete.codeVerifier ?? '' },
    },
    DECOUVERTE,
  );
  if (!jetons.refreshToken) {
    throw new Error(
      "Google n'a pas renvoyé de jeton de rafraîchissement. Révoque l'accès de l'application dans ton compte Google, puis reconnecte-toi.",
    );
  }
  await SecureStore.setItemAsync(CLE_RAFRAICHISSEMENT, jetons.refreshToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  acces = {
    jeton: jetons.accessToken,
    expireLe: Date.now() + (jetons.expiresIn ?? 3500) * 1000,
  };
}

/** Jeton d'accès valide, rafraîchi si besoin. Lève NON_CONNECTE si la session est close. */
export async function jetonAcces(): Promise<string> {
  if (ANDROID) {
    preparerAndroid();
    // Le SDK garde la session et rafraîchit tout seul ; il faut seulement la réveiller
    // au premier appel après un redémarrage de l'application.
    if (!GoogleSignin.getCurrentUser()) {
      const reprise = await GoogleSignin.signInSilently();
      if (reprise.type !== 'success') throw new Error('NON_CONNECTE');
    }
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken;
  }

  if (acces && acces.expireLe > Date.now() + 60_000) return acces.jeton;
  const rafraichissement = await SecureStore.getItemAsync(CLE_RAFRAICHISSEMENT);
  if (!rafraichissement) throw new Error('NON_CONNECTE');
  const jetons = await AuthSession.refreshAsync(
    { clientId: clientId(), refreshToken: rafraichissement },
    DECOUVERTE,
  );
  acces = {
    jeton: jetons.accessToken,
    expireLe: Date.now() + (jetons.expiresIn ?? 3500) * 1000,
  };
  // Google peut faire tourner le jeton de rafraîchissement : on garde le nouveau.
  if (jetons.refreshToken && jetons.refreshToken !== rafraichissement) {
    await SecureStore.setItemAsync(CLE_RAFRAICHISSEMENT, jetons.refreshToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return acces.jeton;
}

/**
 * Jette un jeton que le serveur vient de refuser, pour que le suivant soit redemandé.
 *
 * Le SDK Android sert un jeton depuis son cache sans vérifier qu'il est encore valide :
 * après une révocation ou un changement de mot de passe, l'API répond 401 tant que ce
 * cache n'est pas vidé. Le flux iOS, lui, se contente de son horloge interne.
 */
export async function invaliderJetonAcces(): Promise<void> {
  if (!ANDROID) {
    acces = null;
    return;
  }
  try {
    const { accessToken } = await GoogleSignin.getTokens();
    await GoogleSignin.clearCachedAccessToken(accessToken);
  } catch {
    // Pas de session en cours : il n'y a rien à invalider.
  }
}

/** Déconnexion : révocation côté Google puis effacement de la session locale. */
export async function deconnecter(): Promise<void> {
  if (ANDROID) {
    preparerAndroid();
    try {
      await GoogleSignin.revokeAccess();
    } catch {
      // Révocation impossible (hors ligne) : la session locale est fermée quand même.
    }
    await GoogleSignin.signOut();
    return;
  }

  const rafraichissement = await SecureStore.getItemAsync(CLE_RAFRAICHISSEMENT);
  acces = null;
  await SecureStore.deleteItemAsync(CLE_RAFRAICHISSEMENT);
  if (rafraichissement) {
    try {
      await AuthSession.revokeAsync({ token: rafraichissement }, DECOUVERTE);
    } catch {
      // Révocation impossible (hors ligne) : le jeton local est déjà effacé, l'utilisateur
      // peut finir le ménage depuis son compte Google.
    }
  }
}
