# Distribution Android hors Play Store

Préparé le 21/11/2026, utilisable dès qu'un build propre sera possible.

Ni le dépôt officiel F-Droid ni IzzyOnDroid n'acceptent cette application — motifs
détaillés dans `f-droid.md`. Restent deux voies, qui reposent sur le même fichier.

## Pourquoi passer par une *release* GitHub

Un APK posé sur un site web s'installe, mais ne se met jamais à jour : l'utilisateur
doit penser à revenir. Une *release* GitHub, elle, est lisible par
[Obtainium](https://github.com/ImranR98/Obtainium), une application qui surveille les
dépôts et propose les mises à jour comme le ferait un magasin. C'est la voie qui touche
le public visé par F-Droid, sans passer par un dépôt qui nous refuse.

Aucune inscription, aucun examen, aucun gardien. Le dépôt étant public depuis le
21/11/2026, il n'y a rien d'autre à faire que d'attacher l'APK à une *release*.

## Quel APK publier

Celui du profil **`preview`** :

```
eas build --platform android --profile preview
```

Il produit un APK — `production` produit un app-bundle, qui ne s'installe pas
directement — signé par la clé EAS. C'est volontaire et c'est important : l'environnement
EAS `preview` pointe vers le client OAuth lié à l'empreinte de cette clé
(`68:24:38:03:70:1B:…`). Un APK signé autrement ne pourrait pas se connecter.

Ne pas publier ici l'APK du profil `production` ni un build local : le premier est un
app-bundle, le second est signé par la clé de debug.

## Publier

```powershell
.\tools\publier-release.ps1 -Apk C:\chemin\vers\application.apk
```

Le script refuse de travailler sur un dépôt qui a des modifications non committées —
l'étiquette doit désigner exactement le code publié — et sur une version déjà étiquetée.
Il lit le numéro de version dans `app.config.js` plutôt que de le faire saisir, vérifie
que l'APK est bien signé par la clé EAS, reprend les notes depuis le changelog déjà
écrit pour les magasins, crée l'étiquette `vX.Y.Z` et la *release*.

`-Brouillon` permet de relire avant de rendre la *release* visible.

## Pour l'utilisateur

Dans Obtainium, « Ajouter une application » puis l'URL du dépôt :

```
https://github.com/Epilouptique/MonFluxApp
```

Obtainium repère seul les *releases* et l'APK joint. Pour une installation ponctuelle,
le lien de téléchargement direct suffit.

## Ce qui reste à faire avant la première release

1. **Attendre le 01/12** : les crédits de build EAS sont épuisés, et le dernier APK
   construit est antérieur au SDK natif Google Sign-In — sa connexion échouerait.
2. Construire avec le profil `preview`, vérifier la connexion sur un appareil.
3. Lancer `tools\publier-release.ps1`.
4. Ajouter le lien de téléchargement sur la page de l'application du site, à côté des
   badges des magasins.
