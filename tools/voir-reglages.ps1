# Ouvre l'ecran de reglages et en rapporte une capture.
# Le bouton flottant du client de developpement recouvre le « ... » de l'en-tete :
# on le ferme d'abord, puis on vise le bord droit des trois points.
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'

& $adb -s $appareil shell input keyevent KEYCODE_WAKEUP
Start-Sleep -Seconds 1
& $adb -s $appareil shell input keyevent KEYCODE_BACK
Start-Sleep -Seconds 2
& $adb -s $appareil shell input tap 697 108
Start-Sleep -Seconds 4
& $adb -s $appareil shell screencap -p /sdcard/ecran.png
& $adb -s $appareil pull /sdcard/ecran.png 'C:\Dev\MonFluxApp\tools\ecran.png'
& $adb -s $appareil shell rm /sdcard/ecran.png
