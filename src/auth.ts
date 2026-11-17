// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Connexion Google en OAuth 2.0 + PKCE, depuis l'appareil, sans secret client et sans
// serveur à nous. Le jeton de rafraîchissement est le seul élément durable : il part dans
// le Trousseau iOS (expo-secure-store), jamais dans SQLite ni dans le dépôt.

import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const CLE_RAFRAICHISSEMENT = 'google_refresh_token';

/** Lecture seule des abonnements et des vidéos : rien d'autre n'est demandé. */
export const PORTEES = ['https://www.googleapis.com/auth/youtube.readonly'];

export const DECOUVERTE: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function clientId(): string {
  const id = (Constants.expoConfig?.extra as { googleIosClientId?: string } | undefined)
    ?.googleIosClientId;
  if (!id) {
    throw new Error(
      "Identifiant client Google absent : renseigne EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (voir docs/google-cloud.md).",
    );
  }
  return id;
}

/**
 * Google impose, pour un client iOS, l'identifiant client inversé comme schéma de
 * retour, suivi d'une SEULE barre oblique : com.googleusercontent.apps.X:/oauthredirect
 *
 * Passer { scheme, path } construirait « X://oauthredirect » — deux barres — que Google
 * refuse avec un « 400 invalid_request » parfaitement opaque. L'option « native »
 * transmet l'URL telle quelle ; c'est aussi ce que fait le fournisseur Google officiel
 * d'expo-auth-session.
 */
export function uriRetour(): string {
  const inverse = clientId().split('.').reverse().join('.');
  return AuthSession.makeRedirectUri({ native: `${inverse}:/oauthredirect` });
}

/**
 * Expo Go est inutilisable ici : son URL de retour (exp://…) n'est pas acceptée par
 * Google pour un client iOS, et le proxy d'authentification d'Expo n'existe plus.
 * Mieux vaut le dire franchement que laisser Google renvoyer « invalid_request ».
 */
export function dansExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/** Jeton d'accès en mémoire : court (≈1 h), jamais écrit sur le disque. */
let acces: { jeton: string; expireLe: number } | null = null;

export async function estConnecte(): Promise<boolean> {
  return (await SecureStore.getItemAsync(CLE_RAFRAICHISSEMENT)) !== null;
}

/** Ouvre la page Google, échange le code et conserve le jeton de rafraîchissement. */
export async function connecter(): Promise<void> {
  if (dansExpoGo()) {
    throw new Error(
      'La connexion Google ne fonctionne pas dans Expo Go : Google refuse son URL de retour. Il faut un build de développement (eas build --profile development), voir docs/commandes-build.md.',
    );
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

/** Jeton d'accès valide, rafraîchi si besoin. Lève si l'utilisateur n'est pas connecté. */
export async function jetonAcces(): Promise<string> {
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

/** Déconnexion : révocation côté Google puis effacement du Trousseau. */
export async function deconnecter(): Promise<void> {
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
