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
- `eas.json` : APK pour `preview`, app-bundle pour `production`.

**En attente, volontairement** : la création du client OAuth Android. Voir plus bas.

## Pourquoi le client OAuth Android n'a pas été créé

La demande de validation Google déposée le 18/11 est en cours d'examen. Leur grille
exige que la vidéo de démonstration montre **l'ensemble des clients OAuth du projet**.
La vidéo soumise en montre deux. En ajouter un troisième maintenant la rendrait
incomplète, au risque d'une demande de reprise qui retarderait la validation — donc
l'App Store autant que le Play Store.

Le coût d'attendre est faible : tout le reste avance, seule la connexion Google est
inopérante sur Android. Le coût de ne pas attendre peut se compter en semaines.

Une fois la validation obtenue :

1. relever l'empreinte A ;
2. Console Google Cloud → Clients → Créer un client → Android, nom de paquet
   `fr.dahuconcept.monflux`, empreinte A ;
3. `eas env:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value <client> --type string --visibility plaintext --environment development --environment preview --environment production` ;
4. reconstruire, vérifier la connexion ;
5. après le premier dépôt au Play Store, recommencer avec l'empreinte B.

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
