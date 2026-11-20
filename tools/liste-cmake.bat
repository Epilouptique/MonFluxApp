@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo ---OUTILS-LIGNE-DE-COMMANDE
dir /b "%ANDROID_HOME%\cmdline-tools"
echo ---TEST-SDKMANAGER
if exist "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" (
  echo trouve dans latest
) else (
  dir /b /s "%ANDROID_HOME%\cmdline-tools\*sdkmanager.bat"
)
echo ---FIN
