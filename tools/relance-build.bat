@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo ---ARRET-DEMON-GRADLE
cd /d C:\Dev\MonFluxApp\android
call gradlew.bat --stop

echo ---SUPPRESSION-PROJET-NATIF
cd /d C:\Dev\MonFluxApp
rmdir /s /q "C:\Dev\MonFluxApp\android" 2>nul

echo ---BUILD
npx expo run:android --no-bundler --variant debug
