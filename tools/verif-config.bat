@echo off
cd /d C:\Dev\MonFluxApp
if "%EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID%"=="" set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=placeholder.apps.googleusercontent.com
npx expo config --type public --json > .expo\config-verif.json
node tools\verif-config.mjs
del .expo\config-verif.json
