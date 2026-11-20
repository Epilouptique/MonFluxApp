# F-Droid — étude de faisabilité

État au 20/11/2026. Conclusion en une ligne : **c'est possible, mais il faut d'abord
décider d'ouvrir le code, et le résultat serait une application que le public de
F-Droid n'utiliserait probablement pas.** Le détail ci-dessous, pour que la décision
soit prise en connaissance de cause et non par défaut.

## Ce que F-Droid exige

La [politique d'inclusion](https://f-droid.org/docs/Inclusion_Policy/) pose quatre
conditions, toutes bloquantes :

1. **Code source public, sous licence libre.** GPL, Apache, MIT. Aujourd'hui le dépôt
   est privé et l'application est sous « Tous droits réservés ».
2. **Compilation par F-Droid, depuis les sources**, avec une chaîne d'outils
   entièrement libre. Ils ne redistribuent pas un APK fourni par le développeur.
3. **Aucune dépendance propriétaire** dans ce qui est embarqué.
4. **Passage par une revue humaine** : une demande de packaging puis une requête de
   fusion sur le dépôt `fdroiddata`, avec des allers-retours. Compter des semaines.

## Les quatre obstacles, du plus décisif au plus technique

### 1. Ouvrir le code — ta décision, pas la mienne

C'est le préalable absolu, et c'est une décision d'entreprise. Tes dépôts sont privés
par convention (`CLAUDE.md`), et cette application contient ta façon de résoudre des
problèmes non triviaux : la détection des Shorts étalonnée, le contournement de la
redirection du lecteur, la séparation cache / états pour les 30 jours.

À noter : ouvrir le code n'oblige à rien d'autre. Le client OAuth n'est pas un secret,
il n'y a aucune clé dans le dépôt, et `.gitignore` exclut déjà ce qui ne doit pas
sortir. Techniquement, le dépôt est publiable en l'état.

Si tu ouvres, la licence habituelle pour tes extensions est la **GPL v2 or later** ;
elle convient aussi ici et elle est acceptée par F-Droid.

### 2. React Native et Expo : compilables, mais douloureux

F-Droid a publié un
[guide spécifique aux applications React Native](https://f-droid.org/2020/10/14/adding-react-native-app-to-f-droid.html),
qui existe précisément parce que c'est pénible : deux systèmes de dépendances
superposés, un environnement Node plus récent que celui de leurs serveurs, et des
composants pré-construits qu'il faut leur déclarer un par un comme libres.

De vieilles discussions de leur forum affirment qu'« une application utilisant Expo ne
peut pas être incluse ». Ce verdict visait l'ancien Expo monolithique, qui embarquait
les services Google Play ; ce n'est plus notre cas — notre application n'a ni Firebase,
ni Play Services, et `app.config.js` bloque explicitement les permissions superflues.
Mais l'a priori des mainteneurs reste défavorable, et la recette de compilation sera à
écrire et à défendre.

### 3. La signature — l'obstacle que personne ne voit venir

Un client OAuth Android de Google est lié à un **couple** : nom de paquet + empreinte
SHA-1 du certificat de signature. Or :

- la version que tu distribues toi-même est signée par la clé d'EAS ;
- la version du Play Store est resignée par **Google** (Play App Signing), avec une
  empreinte différente ;
- la version F-Droid serait signée par **F-Droid**, avec une troisième empreinte.

Il faut donc **un client OAuth Android par empreinte**, soit trois. Et celui de
F-Droid ne peut être créé qu'après leur première compilation, puisque l'empreinte
n'existe pas avant. Entre les deux, l'application publiée sur F-Droid ne se connecte
pas du tout.

C'est contournable — F-Droid accepte les « builds reproductibles » signés par le
développeur — mais cela ajoute une exigence technique à une procédure déjà longue.

### 4. Le public de F-Droid ne veut pas de cette application

C'est l'argument qui devrait emporter la décision, et il n'est pas technique.

Mon Flux **exige un compte Google** et dépend de l'API YouTube. F-Droid étiquetterait
l'application d'un *anti-feature* `NonFreeNet` : dépendance à un service réseau non
libre. C'est autorisé, mais c'est un avertissement affiché sur la fiche.

Or le public de F-Droid est précisément celui qui refuse les comptes Google. Pour
regarder YouTube, il utilise NewPipe ou LibreTube, qui ne demandent aucun compte parce
qu'ils ne passent pas par l'API. Une application qui impose une connexion Google y
trouverait peu d'utilisateurs, après des semaines de revue.

## Ce que je recommande

**Ne pas viser le dépôt officiel F-Droid pour l'instant.** L'effort est élevé, le
délai long, et le bénéfice douteux pour ce public précis.

Deux solutions plus raisonnables si l'objectif est « être distribué hors du Play
Store » :

| Voie | Ce qu'elle exige | Délai |
| --- | --- | --- |
| **IzzyOnDroid** | Dépôt public, licence libre, APK publié en *release* GitHub. Pas de compilation par leurs soins. Ce dépôt est consultable depuis le client F-Droid. | Quelques jours |
| **APK sur dahu-concept.fr** | Rien d'autre que le fichier. Le code peut rester fermé. | Immédiat |

La seconde a un avantage inattendu : l'APK étant signé par **ta** clé, l'empreinte ne
change pas, et un seul client OAuth suffit.

## Si tu décides quand même d'y aller

L'ordre serait :

1. Choisir la licence, ajouter `LICENSE` et remplacer `"license": "UNLICENSED"`.
2. Rendre le dépôt GitHub public.
3. Attendre la validation Google — inutile de proposer à F-Droid une application dont
   la connexion est plafonnée à 100 utilisateurs.
4. Ajouter les métadonnées `fastlane/` (déjà préparées dans ce dépôt, elles servent
   aussi au Play Store et à IzzyOnDroid).
5. Déposer une *Request For Packaging* sur le GitLab de F-Droid, puis la recette de
   compilation.
6. Après leur première compilation, relever l'empreinte SHA-1 de leur clé et créer le
   client OAuth Android correspondant.
