@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "SDKM=%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat"

echo y| call "%SDKM%" --install "cmake;3.31.6"
echo ---INSTALLE
dir /b "%ANDROID_HOME%\cmake"
echo ---NINJA
"%ANDROID_HOME%\cmake\3.31.6\bin\ninja.exe" --version
echo ---FIN
