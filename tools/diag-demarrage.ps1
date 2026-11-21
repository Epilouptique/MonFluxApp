$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
Write-Output '---JOURNAL JS'
& $adb -s $appareil logcat -d -s ReactNativeJS:V | Select-Object -Last 40 | ForEach-Object { $_ }
Write-Output ''
Write-Output '---ECRAN'
& $adb -s $appareil shell input keyevent KEYCODE_WAKEUP | Out-Null
Start-Sleep -Seconds 1
& $adb -s $appareil shell screencap -p /sdcard/ecran.png
& $adb -s $appareil pull /sdcard/ecran.png 'C:\Dev\MonFluxApp\tools\ecran.png'
& $adb -s $appareil shell rm /sdcard/ecran.png
