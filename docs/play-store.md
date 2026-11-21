# Play Store — champs prêts à coller et pièges connus

## Le piège des trois signatures

À lire avant tout le reste, parce qu'il provoque une panne que rien ne laisse prévoir.

Un client OAuth Android de Google est lié à un **couple** : nom de paquet + empreinte
SHA-1 du certificat de signature. Une empreinte différente, et la connexion Google
échoue, alors que l'application est par ailleurs identique.

Or la même application porte trois signatures différentes selon sa provenance :

| Provenance | Signée par | Empreinte |
| --- | --- | --- |
| APK installé directement (profil `preview`) | clé de téléversement générée par EAS | A |
| Play Store | **Google**, via Play App Signing | B |
| F-Droid, le cas échéant | clé de F-Droid | C |

**Il faut donc un client OAuth Android par empreinte.** C'est la cause la plus
fréquente d'un « ça marchait en test, ça ne marche plus depuis le Play Store ».

Où lire chaque empreinte :

- **A** : `eas credentials --platform android`, ou la page
  [Credentials du projet](https://expo.dev/accounts/dahuconcept/projects/monflux/credentials)
  sur expo.dev ;
- **B** : Play Console → Configuration → Intégrité de l'application → *Certificat de
  la clé de signature d'application*, après le premier dépôt ;
- **C** : publiée par F-Droid après leur première compilation.

## État au 20/11/2026

Fait :

- code compatible Android (client OAuth et URL de retour choisis selon la plateforme,
  bouton retour matériel pris en charge en plein écran, marges de la barre de gestes) ;
- icône adaptative (avant-plan, arrière-plan, monochrome pour Android 13+) ;
- icône 512×512 et bandeau 1024×500 du Play Store, dans
  `C:\Dev\screenshots-ios\Mon flux\store\` ;
- six captures au format 1080×1920, même dossier ;
- métadonnées `fastlane/metadata/android/fr-FR/`, utilisables aussi par IzzyOnDroid ;
- `eas.json` : APK pour `preview`, app-bundle pour `production` ;
- **chaîne de compilation validée** : l'APK `preview`
  `a6f3440d-18cc-4c7a-bba2-b15986964486` est sorti sans erreur le 20/11 à 15h44.
  Il est installable pour juger l'interface sur un appareil Android, mais la
  connexion y échouera, faute de client OAuth Android ; et il est antérieur à la
  correction de l'écran de démarrage. Ne pas en refaire un tout de suite : le build
  qui comptera est celui d'après la création du client OAuth.

## Client OAuth Android — créé le 20/11/2026

La validation OAuth de Google est **accordée** (niveau d'accès `youtube.readonly`,
projet `monflux-515013`, courriel du 20/11 au soir). L'écran de consentement est en
production, type externe : plus de plafond d'utilisateurs, plus de jeton de
rafraîchissement expirant à sept jours. La raison d'attendre a donc disparu.

Premier client créé dans la foulée :

- nom : **Mon Flux Android (cle EAS)** ;
- nom de paquet : `fr.dahuconcept.monflux` ;
- empreinte SHA-1 : `68:24:38:03:70:1B:61:8D:6C:D3:CA:FC:85:95:E7:B3:C7:79:7B:13`
  (clé d'importation EAS, lisible sur expo.dev → Credentials → Android) ;
- identifiant :
  `631781454408-fq1rq4sprvtstvkagieq0hm8vn5k1s7v.apps.googleusercontent.com`.

Enregistré dans les variables d'environnement EAS `preview` et `production` sous
`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`. Il couvre les APK installés à la main. Le
second client, celui de la clé de Google, reste à créer une fois le premier AAB
envoyé au Play Store — voir ci-dessous.

**Crédits de build EAS épuisés** pour la période, réinitialisation le 01/12/2026. Les
deux AAB déjà construits (versionCode 2 et 3) embarquent un identifiant Android vide :
ils suffisent pour établir la clé de signature de Google, pas pour tester la connexion.

**En attente** : le second client OAuth, qui dépend de l'envoi d'un AAB. Voir plus bas.

## Pourquoi le client OAuth Android a été créé tardivement

Pour mémoire, la raison du délai : la grille d'audit de Google exige que la vidéo de
démonstration montre **l'ensemble des clients OAuth du projet**, et celle qui avait été
soumise en montrait deux. En ajouter un troisième pendant l'examen l'aurait rendue
incomplète, au risque d'une reprise qui aurait retardé l'App Store autant que le Play
Store. Le coût d'attendre était faible, celui de ne pas attendre se comptait en
semaines. La validation accordée le 20/11, le client a été créé le soir même.

## Les quatre clients OAuth et à quoi chacun sert

Fait le 21/11/2026. C'est le point le plus facile à rater du projet, et celui qui
produit le classique « ça marchait en test, plus depuis le magasin ».

Google lie un client OAuth Android au couple **nom de paquet + empreinte SHA-1**. Or
le même code produit des binaires portant des signatures différentes selon la façon
dont ils ont été construits. Il faut donc un client par signature.

| Client | Empreinte SHA-1 | Signe quoi | Où est déclaré l'identifiant |
| --- | --- | --- | --- |
| `Mon Flux Android (debug local)` | `FF:89:CB:4F:92:03:DB:4A:6D:FE:D5:73:C2:12:D3:A5:E2:F1:3F:87` | builds compilés en local (`tools\build-local.bat`) | `.env.local`, non versionné |
| `Mon Flux Android (cle EAS)` | `68:24:38:03:70:1B:61:8D:6C:D3:CA:FC:85:95:E7:B3:C7:79:7B:13` | APK construits par EAS et installés à la main | environnement EAS `preview` |
| `Mon Flux Android (cle Play Store)` | `14:A6:9F:E6:59:B8:1F:A2:E2:B0:3F:D2:93:55:A8:38:E4:7F:9A:1C` | l'application telle que distribuée par le magasin | environnement EAS `production` |
| `Mon Flux Web` | — | audience du jeton d'identité exigée par le SDK natif | les trois, et `.env.local` |

**Le piège, précisément** : un AAB envoyé au Play Store est **resigné par Google**
avec sa propre clé. L'empreinte qui compte à l'exécution n'est donc pas celle d'EAS,
qui n'est que la *clé d'importation*, mais celle de la *clé de signature
d'application* générée par Google. D'où l'environnement `production` pointant vers le
troisième client et non le second.

Les variables EAS sont **une par environnement**. Attention : `eas env:set` modifie la
variable existante, et si elle est rattachée à plusieurs environnements, elle change
partout. Pour des valeurs distinctes, il faut supprimer puis recréer une variable par
environnement.

## Ce qui reste à faire

1. **Reconstruire** après le 01/12 (crédits EAS épuisés) : le dernier AAB est antérieur
   au SDK natif Google Sign-In, sa connexion ne fonctionnerait pas.
2. **Compléter la fiche** du magasin : visuels, déclaration « sécurité des données »,
   classification du contenu — tout est rédigé plus bas.
3. **Ajouter des testeurs internes** avant de déployer la release, aujourd'hui en
   brouillon.

## Fiche Play Console

Application créée dans la Play Console le 21/11/2026 : identifiant
`4972852064536423344`, compte développeur Dahu-Concept, langue par défaut fr-FR,
gratuite. Une release de test interne existe **en brouillon** avec l'AAB versionCode 3,
envoyé uniquement pour fixer la clé de signature de Google. Elle n'est pas déployée et
ne doit pas l'être en l'état.

| Champ | Valeur |
| --- | --- |
| Nom de l'application | `Mon Flux` |
| Description courte (80 car.) | `Vos abonnements YouTube, par ordre de parution` |
| Description complète | `fastlane/metadata/android/fr-FR/full_description.txt` |
| Catégorie | Vidéo et montage vidéo |
| Balises | lecteur vidéo, abonnements, veille |
| Courriel de contact | contact@dahu-concept.fr |
| Site web | https://dahu-concept.fr/references/mon-flux/ |
| Politique de confidentialité | https://dahu-concept.fr/references/mon-flux/confidentialite/ |
| Icône | `play-icone-512.png` |
| Bandeau | `play-bandeau-1024x500.png` |
| Captures téléphone | `monflux-play-01` à `06`, 1080×1920 |

## Sécurité des données — réponses au questionnaire

Le Play Store distingue **collecte** (les données quittent l'appareil) et **partage**
(elles sont transmises à un tiers). Mon Flux ne fait ni l'un ni l'autre.

| Question | Réponse |
| --- | --- |
| L'application collecte-t-elle des données utilisateur ? | **Non** |
| L'application partage-t-elle des données ? | **Non** |
| Les données sont-elles chiffrées en transit ? | Oui — HTTPS exclusivement |
| L'utilisateur peut-il demander la suppression de ses données ? | Oui — déconnexion ou désinstallation |

Justification à conserver si Google conteste : les données lues chez YouTube ne
transitent par aucun serveur de l'éditeur. L'appareil dialogue directement avec Google.
L'éditeur n'en reçoit aucune et n'en conserve aucune. Il n'existe aucun serveur.

Attention : ne pas déclarer l'identifiant de connexion Google comme « collecté ».
L'authentification est gérée par Google ; l'application reçoit un jeton qu'elle stocke
localement et ne transmet à personne.

## Classification du contenu

Le questionnaire portera sur la présence de contenu généré par les utilisateurs. La
réponse honnête est **oui** : l'application affiche des vidéos YouTube, que l'éditeur
ne modère pas. Comme sur l'App Store, cela élèvera la classification. Répondre non
serait une fausse déclaration, et un motif de retrait.

Prévoir aussi la déclaration d'une **URL de politique de confidentialité**, d'un
public cible (adultes, pas d'enfants) et de l'absence de publicité.

## Commandes

```powershell
cd C:\Dev\MonFluxApp
npm run verifier
eas build --platform android --profile preview      :: APK installable directement
eas build --platform android --profile production   :: app-bundle pour le Play Store
eas submit --platform android --latest
```

`eas submit` demande un compte de service Google Play la première fois : Play Console
→ Configuration → Accès à l'API → créer un compte de service, puis lui donner les
droits de publication.
