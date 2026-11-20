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

## Ce qui reste à faire

1. **Envoyer un AAB existant** (versionCode 3) sur la piste de test interne du Play
   Store. Cela fixe définitivement la clé de signature de Google.
2. **Relever les deux empreintes** dans `Tester et publier` → `Configuration` →
   `Intégrité de l'application`. Celle de la *clé de signature d'application* est la
   seule qui compte pour l'application distribuée par le magasin.
3. **Créer le second client OAuth Android** avec cette empreinte, même nom de paquet.
   Les deux clients coexistent : Google choisit selon la signature du binaire qui
   présente la requête.
4. **Reconstruire** après le 01/12 (crédits EAS) et vérifier la connexion sur un
   appareil. Un seul build suffit alors : il sera à la fois testable et publiable.

## Fiche Play Console

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
