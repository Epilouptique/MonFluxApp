$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
$pidApp = (& $adb -s $appareil shell pidof fr.dahuconcept.monflux)
Write-Output ("PID application : {0}" -f $pidApp)
Write-Output '---JOURNAL-RECENT'
& $adb -s $appareil logcat -d -t 600 |
  Select-String -Pattern 'ReactNative','Expo','DevLauncher','monflux','Error','Exception','Unable','fail' |
  Select-Object -Last 35 |
  ForEach-Object { $_.Line }
