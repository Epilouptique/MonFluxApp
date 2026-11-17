# App Store Connect — champs prêts à coller

## Avant toute soumission : deux obstacles à lever

### 1. L'écran de consentement Google doit être vérifié

`youtube.readonly` est un **champ d'application sensible**. En mode « Test », seuls
les comptes inscrits comme testeurs peuvent se connecter : **l'examinateur Apple ne
pourra pas ouvrir l'application**, et le refus est automatique.

Passer en « Production » sans vérification Google limite à 100 utilisateurs et affiche
un avertissement « application non vérifiée » à chaque connexion. La vérification
complète suppose un domaine prouvé, une politique de confidentialité en ligne et une
vidéo de démonstration ; elle prend de quelques jours à plusieurs semaines.

Sans elle, l'application reste parfaitement utilisable — mais en usage personnel ou
en diffusion restreinte (TestFlight), pas sur l'App Store.

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
| Politique de confidentialité | **à créer** : `https://dahu-concept.fr/monflux/confidentialite` |

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

Compte de démonstration fourni ci-dessous. La connexion passe par l'écran Google
officiel ; si une validation en deux étapes est demandée, merci de nous contacter à
contact@dahu-concept.fr, nous la validerons en direct.

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
