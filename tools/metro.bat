@echo off
REM Port fixe et peu frequente : 8081 et 8082 appartiennent a d'autres projets, et
REM laisser Expo choisir produit un port que l'application ne connait pas.
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
cd /d C:\Dev\MonFluxApp
npx expo start --dev-client --port 8088
