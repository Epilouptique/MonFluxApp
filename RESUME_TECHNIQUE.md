# Résumé technique — Mon Flux

Contexte interne. Décisions d'architecture, pièges connus, risques ouverts.

## Le problème réel du projet

Programmer la liste n'est pas difficile. La difficulté est d'obtenir une méthode
**fiable, durable et conforme** pour récupérer les abonnements et leurs nouvelles
vidéos tout en utilisant le lecteur officiel. Tout le reste découle de ce point.

## Décision centrale : solution hybride API + RSS

Trois options étaient sur la table (point 12 du cahier des charges).

| | Abonnements | Nouvelles vidéos | Quota | Verdict |
| --- | --- | --- | --- | --- |
| API seule | `subscriptions.list` | `playlistItems.list`, 1 unité **par chaîne** | ~1 unité/chaîne/synchro | Coûteux : 150 chaînes = 150 unités par ouverture |
| RSS seul | impossible (pas de flux des abonnements) | flux par chaîne, gratuit | 0 | Inapplicable : il faut connaître les identifiants de chaînes |
| **Hybride** | `subscriptions.list` (1 unité/50 chaînes, une fois/jour) | **flux RSS publics**, gratuits | 1 à 3 unités/synchro | **Retenu** |

Conséquence : avec 10 000 unités gratuites par jour, le quota n'est plus un sujet.
`videos.list` ne sert qu'aux **durées** des vidéos encore inconnues (1 unité par lot
de 50), ce qui fait aussi office de détection des Shorts.

Limite assumée du RSS : **15 vidéos par chaîne**. Une chaîne qui publie 16 vidéos
entre deux ouvertures perd les plus anciennes. Sans conséquence pour un usage
quotidien ; à surveiller après une longue absence.

## Détection des Shorts — mesurée, pas devinée

L'API ne donne **aucun indicateur** distinguant un Short d'une vidéo courte. La
première version se fiait à la seule durée. La sonde a montré que cela masquait
**47 % du flux** : beaucoup de chaînes suivies (France TV, Le Monde) publient des
brèves horizontales de une à trois minutes qui ne sont pas des Shorts.

Deuxième signal trouvé : **le format**. `videos.list` avec `part=player` renvoie le
code d'intégration de la vidéo, dont les dimensions reflètent le rapport
largeur/hauteur — à condition de passer `maxHeight`, sans quoi l'iframe sort
toujours en 480×270 et l'information est perdue. Le quota se comptant **par requête
et non par partie**, ce signal ne coûte rien : même appel, même unité.

Étalonnage sur 120 vidéos réparties sur 161 chaînes réelles (`npm run sonde:shorts`),
contre une vérité terrain : `youtube.com/shorts/<id>` répond 200 pour un Short et
303 vers `/watch` sinon.

| Règle | Justesse | Masquées à tort | Shorts ratés |
| --- | --- | --- | --- |
| durée ≤ 180 s | 87,5 % | **15** | 0 |
| durée ≤ 60 s | 68,3 % | 7 | 31 |
| rapport < 1.00 seul | 95,8 % | 2 | 3 |
| rapport < 1.00 ET ≤ 180 s | 97,5 % | 0 | 3 |
| rapport < 1.00 ET ≤ 60 s | 73,3 % | 0 | 32 |
| **rapport ≤ 1.00 ET ≤ 180 s** | **100 %** | **0** | **0** |
| rapport ≤ 1.05 ET ≤ 180 s | 100 % | 0 | 0 |

Retenu : `classerShort()` dans `src/format.ts`. Les deux erreurs ne se valent pas —
un Short qui passe est une nuisance, une brève masquée est une information perdue,
donc on optimise d'abord les « masquées à tort ». En cas de doute (durée ou format
inconnus), la fonction renvoie `null` et **la vidéo reste visible**.

Le passage de `<` à `<=` vient des trois seuls désaccords restants : des Shorts
**carrés**, de rapport exactement 1.00. D'où `SEUIL_RAPPORT = 1` avec comparaison
large, qui atteint 100 % sur l'échantillon.

Tolérance à 1.05 écartée : elle donne le même résultat (aucune vidéo observée entre
1.00 et 1.05), donc elle n'apporte rien et élargit inutilement le risque de masquer
une vidéo presque carrée.

Ces chiffres valent pour les 161 chaînes suivies en novembre 2026. Si le flux change
beaucoup, `npm run sonde:shorts` refait la mesure en une minute.

**Piège de l'étalonnage** : sans en-têtes de navigateur ni cookie `CONSENT=YES+1`,
`youtube.com/shorts/<id>` renvoie 302 vers `consent.youtube.com` pour *toutes* les
vidéos. La première mesure annonçait ainsi « 0 Short réel » sur un échantillon qui en
contenait 40. `tools/diag-shorts.mjs` sert à revérifier ce comportement s'il change.

Piste écartée pour l'application : cette vérification HTTP par vidéo. Fiable, mais
une requête par vidéo, et rien ne garantit la stabilité du comportement. Elle reste
l'étalon des sondes.

## Conservation des données : 30 jours

Les règles de l'API imposent une durée de conservation limitée (30 jours en général)
pour les données issues de YouTube. D'où la séparation stricte, dans SQLite :

- `chaines`, `videos` → **cache YouTube**, purgé au-delà de 30 jours (`purgerCache`) ;
- `etats` (vue / enregistrée) → **nos données**, conservées sans limite.

Une vidéo enregistrée dans « À regarder » échappe à la purge tant qu'elle y est, et
ses métadonnées sont rafraîchies à chaque synchronisation. L'historique, lui, survit
même quand le cache de la vidéo disparaît : il ne contient qu'un identifiant et une
date, et c'est voulu.

## Authentification

OAuth 2.0 + PKCE, client iOS sans secret, depuis l'appareil. Jeton de
rafraîchissement dans le Trousseau iOS (`expo-secure-store`,
`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) ; jeton d'accès en mémoire seulement.

Pièges rencontrés :

- Google exige comme URL de retour l'**identifiant client inversé**. `app.config.js`
  le calcule depuis `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` et l'écrit dans
  `CFBundleURLTypes` : une seule valeur à gérer.
- `access_type=offline` + `prompt=consent` sont nécessaires pour récupérer un jeton
  de rafraîchissement. Sans eux, reconnexion toutes les heures.
- **Expo Go ne convient pas** : son URL de retour est refusée par Google. Il faut un
  build de développement EAS dès la phase 1.
- Écran de consentement en mode « Test » : jeton de rafraîchissement expirant au bout
  de 7 jours. **Réglé le 17/11/2026** : l'application est publiée en Production, la
  session tient donc dans la durée. La vérification Google du champ sensible
  `youtube.readonly` reste à obtenir (voir `docs/app-store.md`).

## Lecteur

IFrame Player API dans une `WebView` (WKWebView sur iOS), page HTML locale. Le lecteur
officiel est conservé : commandes, publicités et recommandations de fin restent en
place. On écoute `onStateChange` pour marquer la vidéo comme vue dès la lecture.

Quatre pièges, tous découverts sur l'appareil et tous coûteux :

1. **L'origine ne doit surtout pas être `youtube.com`.** Servie avec
   `baseUrl: https://www.youtube.com`, la page du lecteur se retrouve sur la même
   origine que l'intégration qu'elle contient, ce qui autorise celle-ci à rediriger
   la WebView entière vers `m.youtube.com`. Symptômes : erreur « 152-4 », titre du
   site mobile visible sous la vidéo, cadrage coupé, et une lecture qui se produit
   en réalité sur le site mobile. On sert donc depuis `https://dahu-concept.fr`,
   valeur reprise dans le paramètre `origin` du lecteur.
2. **L'iframe doit être forcée à 100 %** en CSS : l'API la crée en 640×390, elle
   déborde alors du cadre.
3. **La navigation hors du lecteur est interdite** (`onShouldStartLoadWithRequest`) :
   sans cela, un lien du lecteur emmène la WebView sur le site mobile. Les liens
   partent dans l'application YouTube ou Safari.
4. **Les sous-titres** : `cc_load_policy: 0` ne suffit pas quand le compte YouTube
   les impose. Il faut `unloadModule('captions')` à l'événement `onReady`.

Le son est rétabli (`unMute`) au passage en lecture : iOS n'autorise un démarrage
automatique qu'en sourdine.

### Plein écran

Celui de YouTube repose sur l'API de plein écran du navigateur, que WKWebView refuse
à une page embarquée : le bouton ne faisait rien. Il est donc masqué (`fs: 0`) —
offrir deux commandes dont une inopérante donne l'impression que l'application est
cassée — et remplacé par le nôtre, qui agrandit le cadre et le **pivote d'un quart de
tour** pour une vraie image en paysage. Faire tourner l'appareil demanderait
`expo-screen-orientation`, donc un module natif et un nouveau build. Un Short n'est
pas pivoté : il est déjà vertical.

Attention au cadre d'un Short : un `aspectRatio` 9/16 combiné à un `maxHeight` perd
ses proportions dès que le plafond s'applique, et la vidéo se retrouve réduite et
collée à gauche. La hauteur est calculée d'abord, la largeur en découle, et le cadre
est centré.

## Android

Ajouté le 20/11/2026. Le code est resté commun aux deux plateformes ; seules quatre
choses diffèrent réellement, et aucune n'est un détail.

**Le client OAuth.** Google lie un client Android au couple nom de paquet + empreinte
SHA-1 du certificat de signature, là où un client iOS est lié à l'identifiant de
bundle. Ce sont donc deux clients distincts, et `auth.ts` choisit selon
`Platform.OS`. L'URL de retour diffère aussi : identifiant client inversé sur iOS,
nom de paquet sur Android. D'où `scheme: ['monflux', 'fr.dahuconcept.monflux']` dans
la configuration, qui enregistre le second schéma sans écrire de filtre d'intention.

**Conséquence peu intuitive** : la même application porte trois signatures selon sa
provenance — clé EAS pour un APK installé à la main, clé de Google pour le Play Store
(Play App Signing), clé de F-Droid le cas échéant. Il faut **un client OAuth par
empreinte**. C'est la cause classique du « ça marchait en test, plus depuis le
magasin ». Détaillé dans `docs/play-store.md`.

**Le bouton retour matériel**, qui n'existe pas sur iPhone. En plein écran il réduit
au lieu de quitter l'écran, via `BackHandler`. Sans cela, le geste de retour fait
sortir brutalement de la vidéo.

**Les marges système.** Android dessine désormais sous la barre de navigation : la
barre d'onglets ajoute `insets.bottom` à sa hauteur, sinon les icônes passent derrière
la barre de gestes.

**L'icône adaptative.** Android recompose la forme lui-même à partir d'un avant-plan
et d'un arrière-plan, et rogne une zone de sécurité circulaire de 66 %. Le motif est
donc dessiné avec une marge de 28 %, sans quoi il serait amputé sur les lanceurs
ronds. Une variante monochrome sert aux thèmes dynamiques d'Android 13 et suivants.
Le tout est produit par `_generateur-monflux.py android`.

**Le mécanisme de connexion lui-même**, découvert le 21/11 en testant sur appareil.
L'application s'appuie sur `expo-auth-session`, qui ouvre le navigateur et revient par
un schéma d'URI personnalisé (`fr.dahuconcept.monflux:/oauthredirect`). Google répond
`Erreur 400 : invalid_request — Custom URI scheme is not enabled for your Android
client`.

Ce n'est pas un réglage oublié. Google juge ce mécanisme vulnérable à l'usurpation
d'application : il était désactivé par défaut sur les clients Android, et l'option
« Enable custom URI scheme » a depuis **disparu de la console**. Leur documentation est
explicite : « Custom URI schemes are no longer supported on Android and Chrome apps ».
Vérifié dans les deux interfaces de la console, l'ancienne redirigeant vers la nouvelle.

**Conséquence** : le flux par navigateur qui fonctionne sur iOS ne peut pas fonctionner
sur Android, et aucune configuration ne le rendra possible. Android doit passer par le
SDK natif Google Sign-In, qui s'authentifie via le client Android (nom de paquet +
empreinte SHA-1) sans jamais utiliser d'URL de retour. Les trois clients Android créés
restent donc nécessaires — c'est exactement ce que ce SDK consomme.

iOS n'est pas touché : les schémas personnalisés y restent la norme.

**Le thème sombre et l'écran de démarrage**, deux défauts qu'aucun test ne révèle et
qu'un appareil aurait montrés trop tard. Générer le projet natif avec
`npx expo prebuild --platform android --no-install --clean`, puis lire les fichiers
produits, les a fait apparaître tous les deux :

- `userInterfaceStyle` est ignoré sans `expo-system-ui` — `prebuild` l'écrit en clair
  dans sa sortie. Le réglage est par ailleurs passé de `automatic` à `dark` :
  l'interface est sombre en dur dans `src/theme.ts`, et annoncer `automatic` laissait
  le système composer des éléments natifs clairs par-dessus une application sombre ;
- depuis le SDK 51, la clé `splash` de la configuration n'a plus d'effet sur Android.
  `android/app/src/main/res/values/colors.xml` portait donc toujours
  `splashscreen_background` à `#FFFFFF` : l'application s'ouvrait sur un flash blanc
  avant son premier rendu. L'écran de démarrage se configure par le greffon
  `expo-splash-screen`, déclaré dans `plugins`.

Le dossier `android/` est supprimé après chaque vérification : le projet reste géré
par la configuration, pas par des fichiers natifs committés. Attention, `prebuild`
réécrit aussi les scripts de `package.json` en `expo run:*` — les remettre à la main
plutôt que par `git checkout`, qui emporterait au passage les dépendances ajoutées.

## Risques ouverts

1. **Règles développeur YouTube.** Instruit en détail le 21/11/2026 dans
   `docs/regles-youtube.md`. Trois points d'exposition, et le choix hybride n'en est
   pas la parade : il en est le premier. Le guide interdit de fusionner des données API
   avec d'autres données, or l'application mêle abonnements et durées venus de l'API
   avec des vidéos venues des flux RSS, sans distinction visible. S'y ajoutent la
   question de la « valeur indépendante » — l'argument de vente est surtout soustractif
   — et deux modifications du lecteur (`fs: 0`, déchargement des sous-titres) qui
   suppriment des fonctions standard. Seule la troisième se corrige facilement.
   Sanctions prévues : jusqu'à la fermeture du compte Google associé. Une demande
   d'*API Compliance Audit* permet de poser la question avant de publier. Sans
   conséquence pour un usage personnel.
2. **Nom et marque.** « YouTube » ne peut pas figurer dans le nom de l'application
   ni dans son icône. D'où « Mon Flux ».
3. **Compte Apple Developer** obligatoire pour installer sur l'iPhone (99 €/an).
4. **Dépendance à Google** : forte et non contournable, par construction.

## Tests

`npm run verifier` = `tsc --noEmit`, puis `eslint .`, puis `jest`. 56 tests répartis sur
les endroits où une erreur serait silencieuse et coûteuse :

- `__tests__/rss.test.ts` — analyse du flux Atom, y compris le piège du `entry` unique
  (fast-xml-parser renvoie alors un objet et non un tableau), la miniature absente et
  le flux cassé ;
- `__tests__/format.test.ts` — durées ISO 8601, distinction `null` (pas encore su) /
  `0` (vidéo supprimée), seuil des Shorts, dates relatives ;
- `__tests__/youtube.test.ts` — le réessai unique sur 401 et sa garde contre la boucle
  infinie, `quotaExceeded` distingué d'une panne ordinaire, la pagination des
  abonnements et son garde-fou, les vidéos disparues marquées à 0 ;
- `__tests__/sync.test.ts` — l'économie de quota : abonnements redemandés une fois par
  jour seulement, et surtout **une réponse vide n'écrase jamais les chaînes connues**,
  ce qui protège les abonnements d'un incident réseau ;
- `__tests__/db.test.ts` — les combinaisons de filtres du flux et la purge à 30 jours.

### SQLite est testé sur le vrai moteur

`__tests__/outils/sqlite-memoire.ts` branche `expo-sqlite` sur `node:sqlite`, la base
SQLite embarquée dans Node. Le moteur est donc le vrai et les requêtes de `src/db.ts`
sont réellement exécutées, dialecte compris. Un simulacre de base aurait laissé passer
une faute de SQL sans broncher — c'est précisément ce qu'on voulait éviter sur la purge,
qui est une obligation des règles de l'API.

`__tests__/outils/node-sqlite.d.ts` déclare la seule part de `node:sqlite` utilisée.
Préféré à `@types/node`, qui ferait entrer les globales de Node dans le typage de
l'application, où elles n'ont rien à faire.

Comme `src/db.ts` garde sa connexion dans une variable de module, chaque test appelle
`jest.resetModules()` pour repartir d'une base vierge.

L'interface n'est pas testée : il faudrait un rendu React Native complet pour un
bénéfice faible comparé au coût.

### Linter

`eslint.config.js`, sur `eslint-config-expo`. Deux faux positifs sont désactivés avec
leur motif écrit sur place (ordre des imports et `require` dans les tests, tous deux
imposés par le fonctionnement de Jest) ; les dossiers produits par une commande
(`android/`, `ios/`, `.expo/`) sont ignorés, et `tools/` reçoit les globales Node.

Sa mise en place a révélé deux défauts réels, corrigés :

- `VignetteGlissante.tsx` construisait `new Animated.Value(0)` à chaque rendu dans un
  `useRef` ; passé en `useMemo`, l'objet n'est créé qu'une fois et React n'a plus à
  traverser une référence pendant le rendu ;
- `ListeVideos.tsx` lisait la base sans garde d'abandon : en changeant de filtre
  rapidement, une requête lancée plus tôt mais revenue plus tard réécrivait la liste
  avec le résultat de l'ancien filtre. L'effet porte désormais un drapeau d'abandon.

## Icônes

`node tools/icones.mjs` régénère `assets/` : trois barres empilées, la première
accentuée. Encodeur PNG écrit à la main (zlib seul), donc aucune dépendance de build
et aucun binaire à committer sans savoir d'où il vient. Aucun élément de marque
YouTube : interdit sur l'icône d'une application tierce.

## État au 20/11/2026

**Validation Google accordée le 20/11.** Le niveau d'accès `youtube.readonly` est
approuvé pour le projet `monflux-515013`. L'écran de consentement est en production,
type externe : le plafond de 100 utilisateurs ne s'applique pas à un niveau d'accès
sensible approuvé, et les jetons de rafraîchissement n'expirent plus à sept jours.
C'est ce qui débloque les deux magasins.

**iOS — fonctionnel sur appareil, prêt à soumettre.** L'application tourne sur
l'iPhone : connexion, synchronisation, lecteur, plein écran, Shorts, gestes de
balayage. Les visuels de magasin et les champs App Store Connect sont prêts, et plus
rien ne retient l'examen d'Apple. Détails dans `docs/verification-google.md` et
`docs/app-store.md`.

**Android — fonctionnel sur appareil depuis le 21/11.** Connexion Google, obtention du
jeton et appel à l'API YouTube vérifiés de bout en bout sur un Nokia 2.4 sous
Android 12, depuis un build compilé en local. Le compte d'essai n'était pas un
utilisateur de test, ce qui confirme au passage que la validation Google est active en
production. Son compte n'ayant aucun abonnement, c'est l'état vide qui s'affiche, et il
s'affiche correctement.

Reste deux points, dont un seul est technique :

1. **Rien n'a encore été construit par EAS avec cette authentification**, les crédits
   du mois étant épuisés jusqu'au 01/12. Les deux AAB déjà produits sont antérieurs au
   SDK natif : ils servent à fixer la clé de signature du Play Store, pas à être
   publiés. Il faudra aussi un client OAuth Android par clé de signature — celui de la
   clé EAS existe, celui de la clé de Google attend l'envoi d'un AAB. Suite des
   opérations dans `docs/play-store.md`.
2. **F-Droid suppose d'ouvrir le code** sous licence libre, dépôt public et
   compilation depuis les sources. Décision du propriétaire, pas une question
   technique. Recommandation documentée dans `docs/f-droid.md` : ne pas viser le dépôt
   officiel, et envisager IzzyOnDroid ou un APK auto-hébergé.
