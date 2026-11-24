# Politique de confidentialité : passages à corriger

Page : `https://dahu-concept.fr/references/mon-flux/confidentialite/`
Relevé le 24/11/2026. La page décrit encore une application iPhone seule, alors
qu'Android fonctionne depuis le 21/11. Un examinateur Google qui installe l'APK et
lit « iPhone » dans la politique a une incohérence sous les yeux.

Les corrections sont des remplacements mot pour mot. Rien d'autre ne bouge.

---

## 1. En-tête

**Remplacer** `Dernière mise à jour : 19 novembre 2026`
**par** `Dernière mise à jour : 24 novembre 2026`

## 2. Phrase d'accroche

**Remplacer** « Tout ce qu'elle sait de vous reste sur votre iPhone. »
**par** « Tout ce qu'elle sait de vous reste sur votre appareil. »

## 3. Section « Où vont vos données »

**Remplacer** « Votre iPhone dialogue directement avec Google et YouTube »
**par** « Votre appareil dialogue directement avec Google et YouTube »

## 4. Section « Où vont vos données », premier point de la liste

**Remplacer** le point :

> le jeton d'accès à votre compte Google, dans le Trousseau iOS, l'espace chiffré
> prévu par Apple pour les identifiants ;

**par** :

> sur iPhone, le jeton d'accès à votre compte Google, dans le Trousseau iOS, l'espace
> chiffré prévu par Apple pour les identifiants ; sur Android, l'application ne
> conserve aucun jeton : la connexion est gérée par les services Google Play, qui
> délivrent à la demande un jeton temporaire ;

C'est exact, et c'est vérifié dans `src/auth.ts` : sur Android le SDK natif Google
Sign-In détient la session, l'application se contente de demander un jeton d'accès de
courte durée au moment d'appeler l'API. Le stockage dans le Trousseau est propre à
iOS. Au passage, c'est une meilleure histoire côté confidentialité sur Android, pas
une moins bonne.

## 5. Récapitulatif, point 4 « Protection des données »

**Remplacer** le paragraphe :

> Les échanges avec Google et YouTube se font exclusivement en HTTPS. Le jeton
> d'authentification est conservé dans le Trousseau iOS (Keychain), l'espace chiffré
> par le système et protégé par le code de l'appareil, avec l'attribution la plus
> restrictive : accessible uniquement lorsque l'appareil est déverrouillé, et non
> transférable vers un autre appareil ni vers une sauvegarde. Les données en cache
> résident dans le conteneur privé de l'application, isolé par iOS des autres
> applications. Aucun identifiant n'est écrit en clair, et il n'existe aucun serveur
> susceptible d'être compromis.

**par** :

> Les échanges avec Google et YouTube se font exclusivement en HTTPS. Sur iPhone, le
> jeton d'authentification est conservé dans le Trousseau iOS (Keychain), l'espace
> chiffré par le système et protégé par le code de l'appareil, avec l'attribution la
> plus restrictive : accessible uniquement lorsque l'appareil est déverrouillé, et non
> transférable vers un autre appareil ni vers une sauvegarde. Sur Android,
> l'application ne conserve aucun jeton d'authentification : la session est détenue
> par les services Google Play, et l'application ne demande qu'un jeton d'accès de
> courte durée au moment d'appeler l'API. Les données en cache résident dans le
> conteneur privé de l'application, isolé par le système d'exploitation des autres
> applications. Aucun identifiant n'est écrit en clair, et il n'existe aucun serveur
> susceptible d'être compromis.

## 6. Summary in English, paragraphe « Protection »

**Remplacer** :

> Protection. All traffic uses HTTPS. The refresh token is stored in the iOS Keychain
> with the most restrictive attribute (WHEN_UNLOCKED_THIS_DEVICE_ONLY): available only
> while the device is unlocked, never migrated to another device or to a backup.
> Cached data lives in the app's private container, isolated by iOS. No credential is
> stored in clear text, and there is no server that could be breached.

**par** :

> Protection. All traffic uses HTTPS. On iPhone, the refresh token is stored in the
> iOS Keychain with the most restrictive attribute (WHEN_UNLOCKED_THIS_DEVICE_ONLY):
> available only while the device is unlocked, never migrated to another device or to
> a backup. On Android, the application stores no token at all: the session is held by
> Google Play services, and the application only requests a short-lived access token
> when it calls the API. Cached data lives in the app's private container, isolated by
> the operating system. No credential is stored in clear text, and there is no server
> that could be breached.

## 7. Seconde partie, « Objet »

**Remplacer** « Mon Flux est une application iPhone qui affiche, dans l'ordre
chronologique, »
**par** « Mon Flux est une application mobile, pour iPhone et Android, qui affiche,
dans l'ordre chronologique, »

---

## Ce qu'on ne touche pas

Le reste de la page est juste et reste tel quel : aucun serveur, portée unique
`youtube.readonly`, 30 jours de conservation, flux RSS mentionnés, droits RGPD,
mention « Mon Flux n'est pas affilié à YouTube ni à Google LLC ».
