$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
Write-Output '---ACTIVITE'
& $adb -s $appareil shell "dumpsys activity activities | grep -m1 ResumedActivity"
Write-Output '---JS'
& $adb -s $appareil logcat -d -t 300 | Select-String -Pattern 'ReactNativeJS','auth\]','DevLauncher' | Select-Object -Last 25 | ForEach-Object { $_.Line }
