# App Store Connect — champs prêts à coller

## Avant toute soumission

### 1. Écran de consentement Google — publié le 17/11/2026

Fait : propriété de `dahu-concept.fr` vérifiée dans Search Console, politique de
confidentialité en ligne sur
`https://dahu-concept.fr/references/mon-flux/confidentialite/`, application publiée
en Production. Conséquence directe : **le jeton de rafraîchissement n'expire plus au
bout de 7 jours**, et n'importe quel compte Google peut se connecter.

**Ce qui reste** : `youtube.readonly` est un champ d'application sensible, et la
vérification Google proprement dite n'est pas faite. Tant qu'elle ne l'est pas,
chaque nouvel utilisateur voit un écran « Google n'a pas validé cette application »
qu'il doit contourner par « Paramètres avancés », et le nombre d'utilisateurs est
plafonné à 100.

Pour un usage personnel et pour TestFlight, c'est sans conséquence. Pour l'App Store,
c'est un risque réel : l'examinateur Apple tombera sur cet écran. Il peut passer
outre, mais il peut aussi considérer que l'application ne fonctionne pas. Deux
parades : demander la vérification Google (bouton sur la même page que la
publication ; il faut une vidéo de démonstration), ou décrire précisément le
contournement dans les notes d'examen — ce que fait le texte plus bas.

### 2. Les règles de l'API YouTube

Rappel du risque numéro un du cahier des charges, toujours ouvert : l'agrégation de
données API provenant de chaînes de propriétaires différents est restreinte, et une
application reproduisant une expérience de navigation comparable à YouTube doit
apporter une valeur indépendante significative. Le choix hybride réduit l'exposition
(les vidéos viennent de flux RSS publics, l'API ne sert qu'aux abonnements du
titulaire du compte et aux durées) sans l'annuler.

**Conclusion : TestFlight oui, dès maintenant. App Store public, pas avant d'avoir
tranché ces deux points.** Les champs ci-dessous sont prêts pour le jour où.

---

## Informations générales

| Champ | Valeur |
| --- | --- |
| Nom | `Mon Flux` |
| Sous-titre (30 car. max) | `Vos abonnements, sans le bruit` |
| Identifiant de l'offre | `fr.dahuconcept.monflux` |
| Langue principale | Français (France) |
| Catégorie principale | Photo et vidéo |
| Catégorie secondaire | Productivité |
| Droits d'auteur | `2026 Hugo Vial-Jaime — Dahu-Concept` |
| URL d'assistance | `https://dahu-concept.fr` |
| URL marketing | `https://dahu-concept.fr` |
| Politique de confidentialité | `https://dahu-concept.fr/references/mon-flux/confidentialite/` |

## Mots-clés (100 caractères, séparés par des virgules, sans espaces)

```
abonnements,chronologique,flux,rss,lecteur,sans algorithme,minimaliste,veille,shorts,vidéo
```

Le nom de l'application ne se met jamais dans les mots-clés : il est déjà indexé.

## Description

```
Mon Flux affiche les nouvelles vidéos des chaînes auxquelles vous êtes abonné, dans
l'ordre où elles ont été publiées. Rien d'autre.

Pas de page d'accueil, pas de recommandations, pas de suggestions, pas de fil sans
fin. Vous voyez ce que vous avez choisi de suivre, du plus récent au plus ancien, et
la liste se vide à mesure que vous la consultez.

CE QUE FAIT L'APPLICATION

• Récupère automatiquement vos abonnements après connexion à votre compte Google
• Classe les nouvelles vidéos par date de publication, sans intervention d'un
  algorithme de recommandation
• Masque les Shorts du flux principal et les regroupe dans un onglet à part
• Garde la trace de ce que vous avez déjà regardé
• Permet de mettre une vidéo de côté pour plus tard
• Lit les vidéos dans le lecteur YouTube officiel, intact

GESTES

Glissez une vignette vers la droite pour la garder, vers la gauche pour la marquer
comme vue. Touchez-la pour lancer la lecture en plein écran.

VOS DONNÉES RESTENT CHEZ VOUS

L'historique de lecture et la liste « à regarder » sont stockés sur votre iPhone et
ne sont jamais envoyés à YouTube ni à personne d'autre. L'application n'a aucun
serveur, aucun compte à créer, aucune publicité et aucun traceur. La connexion
Google sert uniquement à lire la liste de vos abonnements, en lecture seule.

Se déconnecter supprime tout de l'appareil.

CE QU'ELLE NE FAIT PAS

Pas de notifications, pas de téléchargement, pas de lecture en arrière-plan, pas de
synchronisation entre appareils, pas de commentaires. C'est volontaire.

Mon Flux n'est pas affilié à YouTube ni à Google.
```

## Nouveautés de cette version (première version)

```
Première version.
```

## Notes pour l'examen Apple

```
L'application nécessite un compte Google disposant d'abonnements YouTube.
Un compte de démonstration est fourni ci-dessous.

IMPORTANT — Google affiche un écran d'avertissement avant la connexion, car la
vérification de notre application auprès de Google est en cours. Pour passer cet
écran : touchez « Paramètres avancés » en bas à gauche, puis « Accéder à Mon Flux
(non sécurisé) ». La connexion se déroule ensuite normalement. Cet avertissement
disparaîtra une fois la vérification Google obtenue ; il ne reflète aucun problème
de sécurité, l'application demandant uniquement un accès en lecture seule.

Si une validation en deux étapes est demandée, merci de nous contacter à
contact@dahu-concept.fr, nous la validerons en direct pendant l'examen.

L'application lit les abonnements en lecture seule (champ youtube.readonly), affiche
les nouvelles vidéos par date, et les lit dans le lecteur YouTube officiel intégré,
sans en retirer les commandes, les liens ni les publicités.
```

Identifiant et mot de passe de démonstration : à renseigner dans App Store Connect,
jamais dans ce dépôt.

## Confidentialité de l'app (questionnaire)

- Collecte de données : **Aucune donnée collectée**.
- Justification : aucun serveur, aucune analyse d'usage, aucun traceur. Les jetons
  Google restent dans le Trousseau de l'appareil, l'historique dans une base SQLite
  locale. Rien n'est transmis à Dahu-Concept.

## Classification par âge

Au questionnaire, répondre **oui** à « Accès web sans restriction » : l'application
affiche le lecteur YouTube, dont les liens mènent au web. Cette réponse porte la
classification à **17+**. Y répondre non serait une fausse déclaration, et c'est un
motif de retrait.

## Captures d'écran

6,9 pouces (1290×2796) obligatoire. Fichiers générés dans
`C:\Dev\screenshots-ios\monflux\store\`, préfixés `monflux-ios-`.
