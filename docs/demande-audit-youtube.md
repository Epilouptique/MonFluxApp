# Demande d'audit de conformité YouTube

Rédigé le 24/11/2026. Point 3 du plan arrêté le 21/11.

---

## Ce que j'ai découvert et qui change le calcul

Les règles développeur disent bien : *« please apply for an API Compliance Audit, and
include a clear summary that mentions any end users in the audit form »*. La voie
existe donc, et elle est officielle.

**Mais il n'existe aucune file « je viens seulement poser la question ».** La page
*Quota and Compliance Audits* ne décrit que cinq formulaires, tous rattachés à autre
chose : demander plus de quota, en redemander après un audit récent, faire appel d'un
audit échoué, répondre à un audit périodique, déclarer un changement de contrôle. Le
formulaire d'entrée (`support.google.com/youtube/contact/yt_api_form`) ouvre sur un
choix entre deux motifs, l'un et l'autre liés au quota :

1. compléter un audit de conformité **pour demander du quota supplémentaire** ;
2. compléter un audit de conformité **pour conserver le quota actuel** (cas d'un
   ré-audit demandé par Google).

Or « Mon Flux » ne demande pas de quota : l'architecture hybride a précisément été
choisie pour rester sous les 10 000 unités par jour, et elle y reste largement. Aucun
des deux motifs ne décrit notre situation.

### Ce que cela implique

Ce n'est pas un obstacle — les règles sanctionnent explicitement cet usage du
formulaire, et la demande atteint bien l'équipe API Services. Mais cela a trois
conséquences qu'il faut regarder en face :

- **Un audit peut échouer.** Il existe un formulaire d'appel pour les projets ayant
  échoué, donc l'échec est un résultat enregistré, pas un simple « non, revenez plus
  tard ».
- **On transforme une incertitude d'interprétation en verdict binaire**, sur les deux
  points précisément les plus interprétables du dossier.
- **Aujourd'hui, la position est tranquille** : validation OAuth accordée, quota par
  défaut, aucune question posée par Google.

### Les deux lectures, honnêtement

**Pour demander quand même.** L'application est aussi une pièce de référence
professionnelle. Une révocation après publication, sur une fiche publique visible,
est bien plus coûteuse pour une vitrine qu'un « non » privé obtenu avant. Et demander
est ce que les règles elles-mêmes recommandent en cas de doute : on ne pourra pas te
reprocher de ne pas avoir cherché à savoir.

**Pour ne pas demander.** La sanction réaliste d'un service non commercial est la
réduction ou la révocation du quota, pas la fermeture du compte — et c'est
corrigeable. Se signaler spontanément sur une question d'appréciation, alors que rien
ne l'exige, attire un examen qu'on n'aurait pas eu.

**Ma recommandation : demander**, mais seulement maintenant que les corrections sont
faites, et pas avant. Elles changent la nature de la demande : il ne s'agit plus de
faire juger une architecture risquée, mais de faire confirmer un service déjà mis en
conformité sur ce qui était corrigeable. C'est toi qui décides, et la décision reste
réversible jusqu'à l'envoi.

---

## Les corrections faites avant d'envoyer

| Point d'exposition | État |
| --- | --- |
| `unloadModule('captions')` retirait la possibilité d'activer les sous-titres | **corrigé le 21/11** |
| Fusion API / RSS invisible pour l'utilisateur | **atténué le 24/11** : la provenance est désormais énoncée dans les réglages |
| Valeur indépendante surtout soustractive | **non corrigé** — c'est une question de produit, posée franchement dans la demande |

Sur le deuxième point, le texte demande que « la différence soit claire pour
l'utilisateur ». L'écran de réglages l'énonce maintenant explicitement : abonnements et
durées depuis l'API, vidéos depuis les flux RSS publics, cache YouTube effacé à
30 jours, données de lecture locales. Le flux lui-même n'a pas été défiguré de badges :
l'obligation porte sur la clarté, pas sur un marquage par ligne.

C'est une atténuation, pas une mise en conformité certaine : une lecture stricte de
« don't merge or combine » viserait la fusion elle-même, pas son affichage. D'où la
question posée telle quelle ci-dessous.

---

## Le formulaire, section par section

Relevé sur le formulaire réel le 24/11/2026
(`support.google.com/youtube/contact/yt_api_form`), compte `dahu.concept@gmail.com`,
dont l'accès au projet Cloud MonFlux a été vérifié.

Le formulaire ne conserve rien si l'onglet se ferme : ces réponses sont ici pour être
recopiées, et c'est le document qui fait foi, pas l'onglet.

### Section 1 — Type de demande

**Effectuer un audit de conformité pour demander une augmentation de quota.**

C'est le seul choix honnête. Le second motif, « conserver le quota actuel (nouvel audit
demandé) », est réservé à qui Google a convoqué pour un ré-audit, ce qui n'est pas le
cas. Le texte libre de la section 3 dit explicitement qu'aucun quota supplémentaire
n'est demandé.

### Section 2 — Organisation et contact

| Champ | Réponse |
| --- | --- |
| Vous faites votre demande | En tant qu'organisation ou entité enregistrée |
| Votre nom légal complet | Hugo Vial-Jaime |
| Nom légal de votre organisation | Hugo Vial-Jaime (nom commercial : Dahu-Concept) |
| Nom de la société mère | *(vide)* |
| Site Web principal | https://dahu-concept.fr |
| Pays | France |
| Adresse postale | **à compléter** |
| Ville | Gap |
| État/Province | Hautes-Alpes |
| Code postal | **à compléter** |
| Taille/Type d'organisation | Développeur indépendant / Entrepreneur individuel |
| Contact principal | Hugo Vial-Jaime — contact@dahu-concept.fr |
| Contact technique | Identique au contact principal |
| Contact commercial | Identique au contact principal |

Un encart de cette section annonce déjà la couleur : la demande doit démontrer « une
valeur propre et significative pour l'écosystème YouTube et ses utilisateurs ». C'est
la question 2 ci-dessous, posée par Google avant même qu'on la pose.

### Section 3 — Modèle économique

| Champ | Réponse |
| --- | --- |
| Audience cible | Grand public |
| Monétisation | Service sans frais (les utilisateurs ne paient pas) |
| Représentant Google | Non, je n'ai pas de représentant Google |
| ID propriétaire de contenu, numéros Google Ads | *(vides, sans objet)* |

« Décrivez les activités de votre entreprise qui sont en lien avec YouTube »
(5 000 caractères) : c'est le champ central. Y coller le texte prêt plus bas.

### Section 4 — Client API

| Champ | Réponse |
| --- | --- |
| Nom du Client API | Mon Flux |
| Le nom contient-il « YouTube » ? | Non |
| URL d'accès principale | https://github.com/Epilouptique/MonFluxApp |
| URL des règles de confidentialité | https://dahu-concept.fr/references/mon-flux/confidentialite/ |
| URL des conditions d'utilisation | la même page, seconde partie |
| Accessible au public ? | **Non** |

Deux points sur la dernière ligne. Elle est exacte aujourd'hui : aucune fiche de
magasin, et aucune release GitHub encore publiée. **Si tu publies la release pour
Obtainium avant d'envoyer, la réponse devient Oui** — l'APK serait alors téléchargeable
par n'importe qui.

Répondre « Non » fait apparaître un bloc **compte de démonstration** : nom
d'utilisateur, **mot de passe** et URL de connexion, pour que Google puisse essayer
l'application. À remplir par toi, je ne saisis pas de mot de passe. Il faut donc un
compte Google jetable, abonné à quelques chaînes pour que le flux ne soit pas vide.

### Section 5 — Cas d'utilisation et quota

| Champ | Réponse |
| --- | --- |
| Combien de numéros de projet | 1 |
| Numéro de projet Google Cloud | 631781454408 |
| Points de terminaison | `subscriptions.list` et `videos.list`, à l'exclusion de tout autre |

Cette section réclame aussi des « justificatifs requis » par projet : captures de la
politique de confidentialité et de l'écran de consentement OAuth, aux normes de
qualité données par le formulaire (1 280 × 720 minimum, texte lisible, barre d'adresse
visible pour les pages web, noms de fichiers parlants).

### Section 6 — Justificatifs

Deux pièces obligatoires, **faites le 24/11** et rangées dans `docs/audit/` :

- `architecture-mon-flux.png` — ce qui vient de l'API, ce qui vient des flux RSS, ce
  qui reste sur l'appareil, et les 30 jours ;
- `parcours-utilisateur-mon-flux.png` — du premier lancement à la déconnexion.

Les deux font 1 600 × 900, au-dessus du minimum exigé.

Note relevée sur le formulaire : « La fonctionnalité d'importation de fichiers est
simulée. » Si les envois ne passent pas, le dire dans le texte libre et proposer les
pièces par retour de courriel.

### Section 7 — Attestations

Huit cases à cocher : acceptation des conditions d'utilisation de l'API, des règles de
confidentialité, du règlement développeur, compréhension du droit de cessation,
attestation de véracité, consentement au traitement des données. **À cocher par toi** :
ce sont des déclarations personnelles, pas des cases techniques.

### Rappel des points de terminaison

Les points de terminaison appelés, et eux seuls :

| Point de terminaison | Usage | Coût | Fréquence |
| --- | --- | --- | --- |
| `subscriptions.list` | récupérer les abonnements de l'utilisateur | 1 unité par page de 50 | une fois par jour au plus |
| `videos.list` (`contentDetails`, `player`) | durée et format, pour distinguer les Shorts | 1 unité par lot de 50 | seulement pour les vidéos de durée inconnue |

Aucun appel à `search.list`. Consommation typique d'une ouverture : 1 à 3 unités.

---

## Texte à coller dans le formulaire

> **Summary of the service**
>
> Mon Flux is a free, open-source mobile application (MIT licence, iOS and Android)
> that shows a user their own YouTube subscriptions as a plain chronological list.
> It is built and maintained by one independent developer and is not a commercial
> product. There is no advertising, no subscription, no paid tier, and no server: the
> application runs entirely on the user's device and the developer operates no backend
> that receives user data.
>
> **End users**
>
> Individuals who sign in with their own Google account to see their own
> subscriptions. The application shows a user only their own data. At the time of
> writing the user base is the developer and a small number of people close to him;
> the intention is to offer it publicly on the App Store and Google Play, which is why
> this audit is being requested before publication rather than after.
>
> **API usage**
>
> Two endpoints are used, and no others:
>
> - `subscriptions.list` — to retrieve the signed-in user's own subscription list,
>   at most once per day (1 unit per page of 50).
> - `videos.list` with `contentDetails` and `player` — to obtain video duration and
>   embed aspect ratio, used to separate Shorts from longer videos. Called only for
>   videos whose duration is not yet known (1 unit per batch of 50).
>
> `search.list` is never called. Typical consumption for one session is 1 to 3 units,
> and the project stays well within the default 10,000-unit allocation. **This request
> is not for additional quota**; the existing allocation is sufficient. The form
> offered no other route for the compliance question below, and the Developer Policies
> direct developers who are unsure whether their service is allowed to apply for an
> API Compliance Audit.
>
> **Data handling**
>
> All data is stored locally in SQLite on the user's device. YouTube API data and
> cached video metadata are deleted automatically 30 days after retrieval, as required
> by the Developer Policies. The user's own reading state — what they have watched,
> what they saved to watch later — is kept locally without a time limit, as it is not
> YouTube data. Signing out erases everything, including the OAuth token. The
> `youtube.readonly` scope is the only scope requested, and OAuth verification for it
> was approved on 20 November 2026 for project 631781454408.
>
> **Two questions I would like the audit to settle**
>
> I would rather describe both honestly than have them discovered later.
>
> *1. Combining API data with public RSS feeds.*
> To keep quota consumption low, the application reads each subscribed channel's
> public YouTube RSS feed to discover new videos, and uses the Data API only for the
> subscription list and for durations. Both are then stored in the same local database
> and displayed in one list. I understand the policy prohibits merging or combining
> YouTube API data with other data, and requires that any difference be made clear to
> users. The application's settings screen now states explicitly which data comes from
> the API and which comes from the public RSS feeds. My question: is reading a
> channel's own public RSS feed alongside the API acceptable with that disclosure, or
> should the application obtain video lists exclusively through the API? I am prepared
> to move entirely to the API if that is the requirement — it costs more quota but
> removes the question.
>
> *2. Independent value.*
> The application presents a user's subscriptions in strict reverse-chronological
> order, separates Shorts from longer videos, keeps a local watch history and a
> "watch later" queue, and deliberately omits recommendations, a home feed and
> infinite scrolling. I recognise that part of what it offers is the *absence* of
> standard YouTube features, and that the policies name reducing standard features as
> something not to do. My question: does what it adds amount to sufficient independent
> value, or would the service be considered a reduced re-creation of YouTube?
>
> **Player configuration**
>
> The IFrame player is used with `rel=0`, `modestbranding` and `cc_load_policy=0`, all
> documented player parameters. The native fullscreen button is hidden with `fs=0`
> and replaced by the application's own control, because the browser fullscreen API
> that the native button relies on is refused to an embedded page by WKWebView, so the
> native button would be visibly inoperative. No player module is unloaded or
> disabled; an earlier `unloadModule('captions')` call was removed on 21 November 2026
> because it took away the user's ability to turn captions on at all.
>
> **Branding**
>
> The application is named "Mon Flux". Neither the name nor the icon contains the word
> YouTube or any YouTube brand element.
>
> **Links**
>
> - Source code: https://github.com/Epilouptique/MonFluxApp
> - Privacy policy: https://dahu-concept.fr/references/mon-flux/confidentialite/
> - Developer: Hugo Vial-Jaime — Dahu-Concept, Gap, France — contact@dahu-concept.fr

---

## Avant d'envoyer

1. Vérifié le 24/11 : le dépôt est public et le lien répond.
2. **À corriger avant d'envoyer.** La politique de confidentialité est en ligne et dit
   l'essentiel correctement (aucun serveur, jeton local, 30 jours de conservation,
   renvoi aux règles de l'API), mais elle décrit encore « l'application iPhone ».
   L'Android est maintenant fonctionnel : la page doit parler des deux plateformes.
   Un examinateur qui installe l'APK et lit « iPhone » dans la politique a une
   incohérence sous les yeux, et c'est exactement le genre de détail qui fait traîner
   un dossier. La page est sur dahu-concept.fr, donc à modifier côté WordPress.
3. Prendre les captures de la politique de confidentialité et de l'écran de
   consentement OAuth, aux normes du formulaire : 1 280 × 720 minimum, texte lisible,
   barre d'adresse visible, noms de fichiers parlants.
4. **Créer le compte Google de démonstration** et l'abonner à quelques chaînes, sans
   quoi l'examinateur ouvrira un flux vide. Ses identifiants sont à saisir par toi
   dans la section 4.
5. **Compléter l'adresse postale et le code postal** dans la section 2 : je ne les
   connais pas et je ne les invente pas sur un formulaire de ce genre.
6. Décider si la release GitHub part avant ou après l'envoi — elle change la réponse
   à « accessible au public ».
7. Les deux schémas obligatoires sont prêts dans `docs/audit/`.

Délai de réponse : non publié par Google, et constaté long par les développeurs qui en
témoignent. Ce n'est pas bloquant : l'application fonctionne déjà par les voies sans
fiche publique.
