# Compiler Android en local, sans crédit EAS

Mis en place le 20/11/2026, quand les crédits de build EAS du mois ont été épuisés.
Un build local est gratuit et illimité ; c'est le bon outil pour itérer, EAS restant
celui des binaires à publier.

## Ce qui était déjà là

Android Studio et le SDK étaient installés sur la machine : plates-formes android-36,
36.1 et 37.0, outils de build 35 à 37, NDK, émulateur, et un JDK 21 fourni par
Android Studio (`jbr`). Rien à télécharger.

Seules manquaient les variables d'environnement, posées par `tools/config-android.bat` :

```
JAVA_HOME    = C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
```

`PATH` n'est volontairement pas modifié : `setx` le tronque à 1024 caractères et
amputerait un `PATH` déjà long. `ANDROID_HOME` suffit à Gradle et à Expo ;
`tools/build-local.bat` complète `PATH` pour la durée de sa seule exécution.

## Le troisième client OAuth

Un APK compilé en local est signé par la clé de debug, pas par celle d'EAS. Comme
Google lie un client OAuth Android au couple nom de paquet + empreinte SHA-1, il faut
**un client par clé**. D'où un troisième client, en plus de celui d'EAS et de celui
que le Play Store exigera :

- nom : **Mon Flux Android (debug local)** ;
- empreinte SHA-1 : `FF:89:CB:4F:92:03:DB:4A:6D:FE:D5:73:C2:12:D3:A5:E2:F1:3F:87`
  (`~/.android/debug.keystore`, alias `androiddebugkey`, mot de passe `android`) ;
- identifiant :
  `631781454408-is6kuru1ujj0amkbe0b38orc3a9lmsvp.apps.googleusercontent.com`.

Il est déclaré dans `.env.local`, que `.gitignore` couvre et que les builds EAS
n'utilisent pas. Pour relire l'empreinte :

```
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v ^
  -keystore "%USERPROFILE%\.android\debug.keystore" ^
  -alias androiddebugkey -storepass android -keypass android
```

## Blocage connu : la limite de 260 caractères de Windows

**Le premier build local a échoué**, et pas à cause du projet :

```
ninja: error: mkdir(safeareacontext_autolinked_build/CMakeFiles/
react_codegen_safeareacontext.dir/C_/Dev/MonFluxApp/node_modules/
react-native-safe-area-context/android/build/generated/source/codegen/jni/
react/renderer/components): No such file or directory
```

CMake reconstruit sous `.cxx` une arborescence qui **recopie le chemin absolu des
sources**, ce qui produit des chemins d'environ 300 caractères. Au-delà de 260,
l'API Windows refuse de créer le dossier, et `ninja` s'arrête. Déplacer le projet
dans un dossier plus court ne suffit pas : on ne gagnerait qu'une trentaine de
caractères sur les trois cents.

### Ce qui ne suffit pas

Activer la prise en charge des chemins longs de Windows est **nécessaire mais pas
suffisant** :

```
reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem ^
  /v LongPathsEnabled /t REG_DWORD /d 1 /f
git config --global core.longpaths true
```

Fait le 20/11/2026, et la compilation a échoué exactement de la même façon. La raison :
ce réglage n'a d'effet que pour un binaire qui le déclare dans son manifeste, et le
`ninja` fourni avec CMake 3.22.1 est en version **1.10.2**, antérieure à la prise en
charge des chemins longs (arrivée en 1.11). Inutile de redémarrer pour ce motif.

### La correction

Installer un CMake récent, qui embarque un `ninja` capable :

```
"%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat" --install "cmake;3.31.6"
```

CMake 3.31.6 fournit `ninja` 1.12.1. **Ne pas prendre une version 4.x** : elles ont
supprimé la compatibilité avec les `CMakeLists` anciens, ce que React Native utilise
encore.

Installer ne suffit pas non plus : React Native épingle 3.22.1, et Gradle continuait
de l'utiliser. D'où `plugins/cmake-version.js`, un greffon de configuration qui écrit
la version voulue dans `app/build.gradle`. Il est déclaré dans `app.config.js` et
survit donc aux `prebuild`, qui régénèrent ce fichier.

Avec les deux, le build passe : **1 min 49 s**, APK installé sur l'appareil.

## Ensuite

```
tools\build-local.bat
```

Le script pose les variables, lance `npx expo run:android` en debug et installe sur
l'appareil branché. Compter quelques minutes la première fois — Gradle télécharge sa
chaîne d'outils — puis beaucoup moins.

Un build de debug charge son code depuis Metro, qu'il faut donc lancer à côté :

```
tools\metro.bat
```

Si le port 8081 est déjà pris par un autre projet, Expo bascule sur 8083 et
l'application, elle, cherche toujours le 8081. Plutôt que de tuer le processus voisin,
rouvrir l'application sur le bon port :

```
tools\ouvrir-app.ps1
```

à ajuster si l'adresse du poste ou le port changent.

Appareil de test utilisé : Nokia 2.4 sous Android 12, branché en USB.

Attention : `expo run:android` lance un `prebuild` qui **réécrit les scripts de
`package.json`** en `expo run:*`. Celui d'iOS doit être remis à `expo start --ios`,
un build iOS étant impossible depuis Windows. Ne pas corriger cela par
`git checkout package.json`, qui emporterait les dépendances ajoutées dans la même
session.
