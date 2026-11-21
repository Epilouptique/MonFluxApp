$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
$apk = 'C:\Dev\MonFluxApp\android\app\build\outputs\apk\debug\app-debug.apk'
$port = 8088

Write-Output '---DESINSTALLATION'
& $adb -s $appareil uninstall fr.dahuconcept.monflux
Write-Output '---INSTALLATION'
& $adb -s $appareil install -r $apk
Write-Output '---TUNNEL'
& $adb -s $appareil reverse ("tcp:{0}" -f $port) ("tcp:{0}" -f $port)
$lien = 'exp+monflux://expo-development-client/?url=http%3A%2F%2Flocalhost%3A{0}' -f $port
& $adb -s $appareil shell am start -a android.intent.action.VIEW -d $lien
Start-Sleep -Seconds 20
& $adb -s $appareil shell screencap -p /sdcard/ecran.png
& $adb -s $appareil pull /sdcard/ecran.png 'C:\Dev\MonFluxApp\tools\ecran.png' | Out-Null
& $adb -s $appareil shell rm /sdcard/ecran.png
