param([int]$port = 8088)
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'

& $adb -s $appareil shell am force-stop fr.dahuconcept.monflux
& $adb -s $appareil reverse ("tcp:{0}" -f $port) ("tcp:{0}" -f $port) | Out-Null
Start-Sleep -Seconds 2
$lien = 'exp+monflux://expo-development-client/?url=http%3A%2F%2Flocalhost%3A{0}' -f $port
& $adb -s $appareil shell am start -a android.intent.action.VIEW -d $lien
Start-Sleep -Seconds 20
& $adb -s $appareil shell screencap -p /sdcard/ecran.png
& $adb -s $appareil pull /sdcard/ecran.png 'C:\Dev\MonFluxApp\tools\ecran.png'
& $adb -s $appareil shell rm /sdcard/ecran.png
