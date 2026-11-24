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

## Ce que le formulaire réclame

À préparer avant de l'ouvrir :

- l'entité légale (Hugo Vial-Jaime / Dahu-Concept, Gap, France) ;
- le numéro de projet Cloud : **631781454408** (`monflux-515013`) ;
- une justification par point de terminaison utilisé ;
- des captures de la politique de confidentialité et du parcours OAuth ;
- un compte de démonstration avec ses identifiants, et un moyen d'essayer
  l'application — l'APK de la voie Obtainium peut servir à cela.

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
3. Prendre les captures de la politique et du parcours OAuth, le formulaire les
   réclame.
4. Préparer un compte de démonstration, ou indiquer que l'application ne montre que
   les données du compte connecté et qu'un compte d'essai sera fourni sur demande.
5. Prévoir un APK téléchargeable pour l'essai — celui de la voie Obtainium convient.

Délai de réponse : non publié par Google, et constaté long par les développeurs qui en
témoignent. Ce n'est pas bloquant : l'application fonctionne déjà par les voies sans
fiche publique.
