@echo off
set "KT=C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
"%KT%" -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
echo ---FIN
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" -s PT99651AA1111403004 shell getprop ro.product.model
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" -s PT99651AA1111403004 shell getprop ro.build.version.release
