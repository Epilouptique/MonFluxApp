# Google Cloud — ce qu'il faut créer

Deux identifiants clients distincts, dans **le même** projet Google Cloud.

## 1. Le projet et l'API

1. [console.cloud.google.com](https://console.cloud.google.com) → nouveau projet,
   nom `mon-flux`.
2. « API et services » → « Bibliothèque » → activer **YouTube Data API v3**.
3. « Écran de consentement OAuth » :
   - type **Externe** (un type « Interne » exige un compte Workspace) ;
   - application en mode **Test** : il suffit d'ajouter ton adresse Google dans
     « Utilisateurs de test ». Aucune validation Google n'est nécessaire tant que
     l'application n'est pas publiée au grand public ;
   - champ d'application à ajouter : `.../auth/youtube.readonly` et rien d'autre.

> En mode Test, le jeton de rafraîchissement expire au bout de **7 jours**. C'est
> acceptable pour la mise au point ; pour un usage quotidien durable il faudra passer
> l'écran de consentement en **Production** (publication possible sans vérification
> Google tant qu'on reste sur un champ d'application non sensible — à confirmer pour
> `youtube.readonly`, voir `RESUME_TECHNIQUE.md`, risques ouverts).

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
