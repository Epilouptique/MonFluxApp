@echo off
REM Repart d'un cache Metro sain. Les ports 8081 et 8082 appartiennent a d'autres
REM projets : on ne touche qu'aux notres.
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
cd /d C:\Dev\MonFluxApp

for %%P in (8083 8088) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    echo Arret du processus %%A sur le port %%P
    taskkill /PID %%A /F >nul 2>&1
  )
)

rmdir /s /q "C:\Dev\MonFluxApp\.expo" 2>nul
npx expo start --dev-client --port 8088 --clear
