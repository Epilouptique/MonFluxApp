@echo off
echo ---STUDIO-CONTENU
dir /b "C:\Program Files\Android\Android Studio"
echo ---JBR
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
  echo present
  "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" -version 2>&1
) else (
  echo absent
)
echo ---SDK-RACINE
dir /b "%LOCALAPPDATA%\Android\Sdk"
echo ---FIN
