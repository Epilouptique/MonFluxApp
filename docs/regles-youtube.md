# Règles développeur YouTube : où se situe réellement « Mon Flux »

Instruit le 21/11/2026 à partir des *YouTube API Services - Developer Policies* et du
guide *Complying with YouTube's Developer Policies*. Ce document n'est pas un avis
juridique : il sépare ce que le texte dit de ce qui relève de l'interprétation, pour
que la décision soit prise en connaissance de cause.

## Ce qui est conforme, et sans discussion

- **Le lecteur officiel est utilisé, intact.** La lecture se fait dans l'IFrame Player
  de YouTube. Les publicités s'y affichent normalement, les métadonnées, le titre et la
  miniature sont préservés.
- **Aucun téléchargement, aucune mise en cache de contenu audiovisuel.**
- **Aucun scraping.** Les flux RSS utilisés sont publiés par YouTube, ce n'est pas de
  l'extraction sauvage.
- **Les données utilisateur sont traitées correctement** : politique de confidentialité
  publiée, purge du cache à 30 jours, déconnexion qui révoque l'accès et efface tout,
  aucun identifiant de connexion stocké, aucune donnée transmise à un tiers.
- **Aucun frais** pour un service gratuit sur YouTube.
- **Aucune métrique dérivée**, aucune analyse de l'activité de chaînes tierces, aucun
  classement de chaînes. La clause d'agrégation la plus citée — « ne pas agréger pour
  obtenir des informations sur l'activité de YouTube » — vise les outils d'analyse
  d'audience. Elle ne concerne pas une application qui montre à un utilisateur **ses
  propres abonnements**. C'était une fausse piste dans les premières versions de ce
  dossier.

## Les trois points d'exposition réels

### 1. La fusion de données API et non-API — le plus sérieux

Le guide est explicite : **« Don't merge or combine YouTube API data with any other
data »**, et si des données d'autres sources sont affichées à côté des données API, la
différence doit être claire pour l'utilisateur.

Or l'architecture hybride fait exactement cela : la liste des abonnements et les durées
viennent de l'API, les vidéos elles-mêmes des flux RSS publics, et tout est fusionné
dans une même base SQLite puis dans une même liste à l'écran. Rien ne distingue, pour
l'utilisateur, ce qui vient d'où.

L'intention de la clause semble viser la comparaison entre plateformes — ne pas mêler
des chiffres YouTube à des chiffres TikTok sans le dire. Le texte, lui, est plus large.

**C'est le point le plus inconfortable du dossier** : l'architecture hybride a été
choisie pour économiser le quota, et elle est peut-être le principal problème de
conformité. L'ironie est que l'option « API seule », écartée au départ pour son coût,
ne poserait pas cette question.

### 2. La valeur indépendante

Le guide dit : **« Don't use our API to re-create YouTube (e.g. don't clone, mimic,
modify, or reduce standard YouTube features). If your API service mimics any of
YouTube's user experiences, it must add sufficient independent value. »** La valeur
indépendante y est définie comme une fonctionnalité qui n'est pas disponible via l'API
YouTube.

« Mon Flux » reproduit l'onglet « Abonnements » de YouTube. Ce qu'il ajoute : ordre
strictement chronologique, séparation des Shorts, historique de lecture local, file
« à regarder ».

Ce qu'il retire : les recommandations, la page d'accueil, le fil sans fin.

Honnêtement, l'essentiel de l'argument de vente est **soustractif**, et le texte
mentionne expressément « reduce standard YouTube features » parmi les choses à ne pas
faire. Les ajouts existent mais sont modestes. Un examinateur bienveillant y verra une
valeur réelle pour un public précis ; un examinateur strict y verra un client YouTube
allégé.

### 3. Les modifications du lecteur — corrigeable

Le guide interdit de **« modifier, ajouter ou bloquer les fonctions de lecture
standard »**, en citant le masquage de la roue des réglages et la désactivation des
liens vers les vidéos associées.

Le lecteur est actuellement configuré avec :

| Paramètre | Effet | Statut |
| --- | --- | --- |
| ~~`unloadModule('captions')`~~ | déchargeait le module de sous-titres | **retiré le 21/11/2026** |
| `fs: 0` | masque le bouton plein écran natif, remplacé par le nôtre | conservé, défendable |
| `rel: 0` | limite les vidéos associées à la même chaîne | paramètre officiel |
| `modestbranding` | réduit le logo | paramètre officiel |
| `cc_load_policy: 0` | n'active pas les sous-titres par défaut | paramètre officiel |

`unloadModule` était le seul réglage véritablement problématique : il ne désactivait
pas un comportement par défaut, il **retirait à l'utilisateur la possibilité même**
d'activer les sous-titres. Il avait été ajouté parce qu'une préférence de compte
YouTube peut forcer les sous-titres malgré `cc_load_policy: 0`. Retiré : le confort
d'un utilisateur ne justifie pas de supprimer une fonction pour tous, et le réglage se
corrige dans le compte YouTube de l'intéressé.

`fs: 0` est conservé, et c'est défendable. Le bouton natif s'appuie sur l'API de plein
écran du navigateur, que WKWebView refuse à une page embarquée : le laisser visible
afficherait une commande inopérante à côté de la nôtre. On ne masque donc pas une
fonction qui marche, on en remplace une qui ne peut pas marcher dans ce contexte — et
le guide accepte des contrôles de lecture personnalisés tant qu'ils n'entrent pas en
conflit avec l'interface du lecteur.

Les trois derniers sont des paramètres documentés du lecteur, prévus par Google.

## Ce que risque le projet

Le guide énonce les sanctions : **réduction du quota, révocation des clés API et des
accès associés, ou d'autres mesures, y compris la fermeture du compte Google associé.**

Cette dernière mention mérite d'être lue deux fois. Le risque n'est pas seulement que
l'application cesse de fonctionner : c'est le compte Google rattaché au projet qui peut
être fermé. Pour un indépendant dont l'activité passe par ce compte, l'enjeu dépasse
largement l'application.

À relativiser tout de même : la sanction habituelle pour une petite application non
commerciale est la réduction ou la révocation du quota, pas la fermeture d'un compte.
La fermeture figure dans le texte comme sanction maximale, pas comme pratique courante.

## La porte de sortie que je n'avais pas vue

Le guide prévoit explicitement le doute : **« If you're unsure whether your service is
allowed, apply for an API Compliance Audit »**, en joignant un résumé clair du service
et de ses utilisateurs finaux.

Autrement dit, il existe une voie officielle pour poser la question **avant** de
publier, plutôt que de publier et d'attendre de voir. C'est lent, mais cela transforme
un pari en réponse.

## Les options, et ce qu'elles coûtent

### La vraie question n'est pas le nombre d'utilisateurs

Il n'existe pas de demi-publication. Dès qu'une fiche existe sur un magasin,
l'application est trouvable et installable par tout le monde, même si trois personnes
l'utilisent en pratique. La distinction utile n'est donc pas « peu » contre « beaucoup
d'utilisateurs », mais **avec ou sans fiche publique** :

| Mode | Qui peut l'installer | Fiche publique | Mises à jour |
| --- | --- | --- | --- |
| Play Store, **test interne** | jusqu'à 100 personnes invitées nommément | non | automatiques, le build n'expire pas |
| App Store, **TestFlight** | invités par lien | non | automatiques, mais **le build expire à 90 jours** |
| iOS, **build de développement** | appareils enregistrés nommément dans le compte développeur | non | manuelles ; profil valable un an au plus |
| **Fiche publique** sur l'un ou l'autre magasin | tout le monde | oui | automatiques |

Juridiquement, les règles s'appliquent dès le premier appel à l'API, fiche publique ou
pas. En pratique la différence est réelle : une fiche publique est trouvable, indexée,
examinable et signalable. C'est elle qui expose la question de la « valeur
indépendante », puisque c'est à ce moment-là qu'on offre au public une application
reproduisant une expérience YouTube.

### Les options

| Option | Risque | Coût | Pour qui |
| --- | --- | --- | --- |
| **Sans fiche publique** | quasi nul | aucun — tout est déjà fait | si l'application est d'abord pour soi et ses proches |
| **Corriger puis demander l'audit** | faible | quelques heures + plusieurs semaines d'attente | si la fiche publique compte |
| **Corriger puis publier sans demander** | réel mais modéré | quelques heures | si l'on accepte une révocation possible |
| **Publier en l'état** | le plus élevé | aucun | déconseillé |

Les corrections visées sont, par ordre d'efficacité :

1. ~~rétablir le module de sous-titres~~ — **fait le 21/11/2026** ;
2. distinguer visiblement, dans l'interface, ce qui vient de l'API et ce qui vient des
   flux RSS — ou renoncer aux flux RSS et revenir à l'API seule, ce qui coûte du quota
   mais supprime la question ;
3. renforcer la valeur ajoutée par des fonctions qui n'existent pas chez YouTube, pour
   que l'argument ne soit plus seulement soustractif.

Mise à jour du 24/11 : le point 2 a été **atténué** sans démonter l'architecture.
L'écran de réglages énonce désormais explicitement la provenance des données —
abonnements et durées depuis l'API, vidéos depuis les flux RSS publics, cache YouTube
effacé à 30 jours, données de lecture locales. Le texte des règles demande que « la
différence soit claire pour l'utilisateur » : c'est cette obligation-là qui est
satisfaite. Le flux n'a pas été couvert de badges, l'exigence portant sur la clarté et
non sur un marquage par ligne.

Cela ne tranche pas tout : une lecture stricte de *« don't merge or combine »* viserait
la fusion elle-même, pas son affichage. D'où la question posée franchement dans la
demande d'audit. Renoncer aux flux RSS reste possible et coûterait du quota ; on ne
démonte pas une architecture qui fonctionne sur la foi d'une interprétation avant
d'avoir la réponse.

Le point 3 n'est pas engagé : c'est une question de produit, pas de conformité
mécanique, et elle est posée telle quelle dans la demande.

## Décision prise le 21/11/2026

Viser la **fiche publique**, et demander l'audit avant. Le délai de réponse n'est pas
un problème : l'application fonctionne déjà pour son auteur et ses proches par les
voies sans fiche publique. Selon le retour, on ajustera, et dans le pire des cas on
renoncera à la fiche publique en conservant la distribution privée.

En attendant, l'architecture reste inchangée.

## Révision du 24/11/2026 : la voie de l'audit n'est pas neutre

En préparant la demande, j'ai découvert que **la « porte de sortie » décrite plus haut
n'a pas de file dédiée**. La page *Quota and Compliance Audits* ne liste que cinq
formulaires, tous rattachés à autre chose : demande de quota, redemande après audit
récent, appel d'un audit échoué, audit périodique, changement de contrôle. Le
formulaire d'entrée impose de choisir entre deux motifs liés au quota, alors que
« Mon Flux » ne demande pas de quota et reste très en dessous du plafond par défaut.

Trois conséquences :

- un audit **peut échouer**, et l'échec est un résultat enregistré — il existe un
  formulaire d'appel pour cela ;
- on convertit une incertitude d'interprétation en **verdict binaire**, sur les deux
  points les plus interprétables du dossier ;
- la position actuelle est tranquille : validation OAuth accordée, quota par défaut,
  aucune question posée par Google.

Cela ne rend pas la demande illégitime — les règles sanctionnent explicitement cet
usage du formulaire. Mais le calcul du 21/11 supposait une démarche sans coût, et elle
en a un.

La décision reste **demander**, pour une raison précise : l'application est aussi une
pièce de référence professionnelle, et une révocation après publication sur une fiche
publique visible coûte bien plus cher qu'un refus privé obtenu avant. La différence
avec le 21/11 est le moment : on demande **après** les corrections, pas avant. Il ne
s'agit plus de faire juger une architecture risquée mais de faire confirmer un service
déjà mis en conformité sur ce qui était corrigeable.

Le détail, le texte à envoyer et ce qui reste à préparer : `docs/demande-audit-youtube.md`.

## Ce que je ne peux pas trancher

Je ne suis pas juriste, et deux des trois points relèvent de l'appréciation d'un
examinateur, pas d'une règle mécanique. Ce dossier sert à décider en sachant ce qui est
certain, ce qui est interprétable, et ce qui est corrigeable.
