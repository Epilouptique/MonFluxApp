param([int]$x = 0, [int]$y = 0)
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'

# Un ecran eteint donne une capture blanche : on reveille d'abord.
& $adb -s $appareil shell input keyevent KEYCODE_WAKEUP
Start-Sleep -Seconds 1
& $adb -s $appareil shell wm dismiss-keyguard
Start-Sleep -Seconds 2

if ($x -gt 0) {
  & $adb -s $appareil shell input tap $x $y
  Start-Sleep -Seconds 4
}
& $adb -s $appareil shell screencap -p /sdcard/ecran.png
& $adb -s $appareil pull /sdcard/ecran.png 'C:\Dev\MonFluxApp\tools\ecran.png'
& $adb -s $appareil shell rm /sdcard/ecran.png
