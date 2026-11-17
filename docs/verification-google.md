# Validation Google du champ `youtube.readonly`

`youtube.readonly` est un champ **sensible** : Google exige une validation avant que
l'application puisse servir des utilisateurs au-delà du plafond, sans écran
d'avertissement.

## Ordre des opérations

Le centre de validation refuse la demande tant que le branding n'est pas **publié** —
« publier l'application » et « publier le branding » sont deux actions distinctes, sur
deux pages différentes.

1. Google Auth Platform → **Branding** → bouton de publication.
2. Google Auth Platform → **Centre de validation** → demander la validation de
   l'accès aux données.

## Ce que la demande réclame

- La **justification de chaque champ** demandé. Un seul ici, ce qui joue en notre
  faveur : `youtube.readonly` sert à lire la liste des abonnements du titulaire du
  compte, et la durée des vidéos pour distinguer les Shorts. Rien d'autre n'est
  demandé, et l'application ne peut ni publier, ni commenter, ni s'abonner.
- Le lien vers la **politique de confidentialité**, hébergée sur le domaine vérifié :
  `https://dahu-concept.fr/references/mon-flux/confidentialite/`.
- Une **vidéo de démonstration** publique (YouTube, non répertoriée). Elle doit
  montrer, sans coupure : l'URL de l'écran de consentement OAuth, la demande de
  permission avec le champ affiché, puis l'usage réel des données dans
  l'application — ici, la liste des abonnements qui se remplit, puis le flux
  chronologique.

## Ce qu'il faut savoir avant de demander

Cette demande est examinée par un humain, et c'est l'endroit où les règles de l'API
YouTube peuvent être soulevées : agrégation de données provenant de chaînes
appartenant à des propriétaires différents, et obligation d'apporter une valeur
indépendante significative quand on reproduit une expérience de navigation comparable
à YouTube.

C'est une bonne nouvelle sur le fond : c'est un avis motivé, obtenu avant d'avoir
investi dans une soumission App Store. Le pire résultat possible est de l'apprendre
par un refus Apple après coup.

Arguments à faire valoir, tous vrais :

- les vidéos ne viennent pas de l'API mais des **flux RSS publics** de YouTube ;
- l'API ne sert qu'aux **abonnements du titulaire du compte** et aux durées ;
- la lecture se fait dans le **lecteur officiel**, sans en retirer les commandes, les
  liens ni les publicités ;
- les données issues de l'API sont **effacées au bout de 30 jours** ;
- aucune donnée n'est collectée, revendue ni transmise à un tiers.

## Délai

De quelques jours à plusieurs semaines. TestFlight ne l'attend pas : la diffusion y
est limitée à des testeurs que tu choisis, et l'écran d'avertissement Google n'y est
pas bloquant.
