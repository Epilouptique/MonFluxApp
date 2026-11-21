param([int]$x = 0, [int]$y = 0)
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
if ($x -gt 0) {
  & $adb -s $appareil shell input tap $x $y
  Start-Sleep -Seconds 3
}
$sortie = 'C:\Dev\MonFluxApp\tools\ecran.png'
& $adb -s $appareil shell screencap -p /sdcard/ecran.png
& $adb -s $appareil pull /sdcard/ecran.png $sortie
& $adb -s $appareil shell rm /sdcard/ecran.png
