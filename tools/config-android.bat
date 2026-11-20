@echo off
REM Configure la compilation Android locale : JDK fourni par Android Studio et SDK.
REM PATH n'est volontairement pas modifie : setx le tronque a 1024 caracteres et
REM peut amputer un PATH deja long. ANDROID_HOME suffit a Gradle et a Expo.

setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr" >nul
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk" >nul

echo JAVA_HOME    = C:\Program Files\Android\Android Studio\jbr
echo ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
echo.
echo Variables posees pour l'utilisateur. Elles ne vaudront que dans les
echo nouveaux terminaux : celui-ci ne les voit pas encore.
