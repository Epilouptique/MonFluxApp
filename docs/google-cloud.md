# Google Cloud — ce qu'il faut créer

Deux identifiants clients distincts, dans **le même** projet Google Cloud.

## 1. Le projet et l'API

1. [console.cloud.google.com](https://console.cloud.google.com) → nouveau projet,
   nom `mon-flux`.
2. « API et services » → « Bibliothèque » → activer **YouTube Data API v3**.
3. « Écran de consentement OAuth » :
   - type **Externe** (un type « Interne » exige un compte Workspace) ;
   - champ d'application à ajouter : `.../auth/youtube.readonly` et rien d'autre.

### État au 17/11/2026 : publié en Production

Propriété de `dahu-concept.fr` vérifiée dans Search Console, politique de
confidentialité en ligne sur
`https://dahu-concept.fr/references/mon-flux/confidentialite/`, application publiée.

> Le mode **Test** fait expirer le jeton de rafraîchissement au bout de **7 jours** et
> n'autorise que les comptes déclarés testeurs. C'est pour cela qu'on en est sorti :
> en Production, la session tient dans la durée et n'importe quel compte peut se
> connecter.
>
> `youtube.readonly` restant un champ **sensible**, la vérification Google n'est pas
> acquise pour autant : écran « application non vérifiée » à la première connexion de
> chaque utilisateur, et plafond de 100 utilisateurs. Voir `docs/app-store.md`.

## 2. Identifiant client « Application de bureau » — pour la sonde

« Identifiants » → « Créer » → « ID client OAuth » → type **Application de bureau**.
Il donne un identifiant **et** un secret, utilisés uniquement par `tools/sonde.mjs`
sur le PC (jamais embarqués dans l'application).

Dans **PowerShell** (le terminal par défaut de VS Code) :

```powershell
$env:SONDE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
$env:SONDE_CLIENT_SECRET="yyyyy"
npm run sonde
```

Dans une invite `cmd`, la syntaxe est `set SONDE_CLIENT_ID=xxxxx` sans guillemets.
Dans les deux cas, la variable ne vaut que pour la fenêtre en cours.

## 3. Identifiant client « iOS » — pour l'application

« Créer » → « ID client OAuth » → type **iOS** →
identifiant de l'offre groupée : `fr.dahuconcept.monflux`.

Un client iOS n'a **pas** de secret : l'échange de code se fait en PKCE depuis
l'appareil. L'URL de retour est l'identifiant client inversé, que `app.config.js`
calcule tout seul.

```powershell
$env:EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="123-abc.apps.googleusercontent.com"
```

Pour les builds EAS, la même valeur est à déclarer en variable d'environnement du
projet EAS (`eas env:create`), sur les environnements `development`, `preview` et
`production`.
