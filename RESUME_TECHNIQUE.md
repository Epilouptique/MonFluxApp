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

## Risques ouverts

1. **Règles développeur YouTube.** L'agrégation de données API provenant de chaînes
   appartenant à des propriétaires différents est restreinte, et une application qui
   reproduit une expérience de navigation comparable à YouTube doit apporter une
   valeur indépendante significative. Le choix hybride réduit l'exposition — les
   vidéos viennent de flux RSS publics, l'API ne sert qu'aux abonnements du titulaire
   du compte et aux durées — mais **ne l'annule pas**. À trancher avant toute
   publication sur l'App Store ; sans conséquence pour un usage personnel.
2. **Nom et marque.** « YouTube » ne peut pas figurer dans le nom de l'application
   ni dans son icône. D'où « Mon Flux ».
3. **Compte Apple Developer** obligatoire pour installer sur l'iPhone (99 €/an).
4. **Dépendance à Google** : forte et non contournable, par construction.

## Tests

`npm run verifier` = `tsc --noEmit` puis `jest`. Les tests portent sur les deux endroits
où une erreur serait silencieuse et coûteuse :

- `__tests__/rss.test.ts` — analyse du flux Atom, y compris le piège du `entry` unique
  (fast-xml-parser renvoie alors un objet et non un tableau), la miniature absente et
  le flux cassé ;
- `__tests__/format.test.ts` — durées ISO 8601, distinction `null` (pas encore su) /
  `0` (vidéo supprimée), seuil des Shorts, dates relatives.

Rien n'est testé côté SQLite ni interface : cela demanderait des simulacres de modules
natifs pour un bénéfice faible à ce stade.

## Icônes

`node tools/icones.mjs` régénère `assets/` : trois barres empilées, la première
accentuée. Encodeur PNG écrit à la main (zlib seul), donc aucune dépendance de build
et aucun binaire à committer sans savoir d'où il vient. Aucun élément de marque
YouTube : interdit sur l'icône d'une application tierce.

## État au 17/11/2026

Phases 1 à 4 du plan écrites, compilées et empaquetées :

- `tsc --noEmit` propre, 13 tests au vert ;
- `expo-doctor` : 20/20 ;
- `expo export --platform ios` : 1331 modules, 3,3 Mo, sans erreur ;
- icônes et écran de démarrage générés.

Rien n'a encore tourné sur un appareil : aucun identifiant Google n'est créé, aucun
projet EAS n'est initialisé. Prochaine étape réelle : `docs/google-cloud.md`, puis
`npm run sonde`, qui valide les phases 0 à 2 sans aucun coût et sans iPhone.
