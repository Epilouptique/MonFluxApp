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

| Paramètre | Effet | Risque |
| --- | --- | --- |
| `fs: 0` | supprime le bouton plein écran natif, remplacé par le nôtre | élevé |
| `unloadModule('captions')` | décharge le module de sous-titres | élevé |
| `rel: 0` | limite les vidéos associées à la même chaîne | modéré |
| `modestbranding` | réduit le logo | faible, paramètre officiel |
| `cc_load_policy: 0` | n'active pas les sous-titres par défaut | faible |

Les deux premiers suppriment des fonctions standard du lecteur. Ils ont été ajoutés
pour des raisons d'ergonomie — sous-titres s'activant tout seuls, plein écran qui ne
fonctionnait pas correctement — pas pour contourner quoi que ce soit, mais le texte ne
s'intéresse pas à l'intention.

**C'est le seul des trois points qui se corrige en une heure de travail.**

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

| Option | Risque | Coût | Pour qui |
| --- | --- | --- | --- |
| **Usage personnel seul** | quasi nul | aucun — tout est déjà fait | si l'application était d'abord pour soi |
| **Corriger puis demander l'audit** | faible | quelques heures + plusieurs semaines d'attente | si la publication compte vraiment |
| **Corriger puis publier sans demander** | réel mais modéré | quelques heures | si l'on accepte une révocation possible |
| **Publier en l'état** | le plus élevé | aucun | déconseillé |

Les corrections visées sont, par ordre d'efficacité :

1. rétablir le bouton plein écran et le module de sous-titres du lecteur ;
2. distinguer visiblement, dans l'interface, ce qui vient de l'API et ce qui vient des
   flux RSS — ou renoncer aux flux RSS et revenir à l'API seule, ce qui coûte du quota
   mais supprime la question ;
3. renforcer la valeur ajoutée par des fonctions qui n'existent pas chez YouTube, pour
   que l'argument ne soit plus seulement soustractif.

## Ce que je ne peux pas trancher

Je ne suis pas juriste, et deux des trois points relèvent de l'appréciation d'un
examinateur, pas d'une règle mécanique. Ce dossier sert à décider en sachant ce qui est
certain, ce qui est interprétable, et ce qui est corrigeable.
