$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
$pidApp = (& $adb -s $appareil shell pidof fr.dahuconcept.monflux).Trim()
Write-Output ("PID application : {0}" -f $pidApp)
Write-Output '---ACTIVITE'
& $adb -s $appareil shell "dumpsys activity activities | grep -m1 ResumedActivity"
Write-Output '---JS ET ERREURS DE L APPLICATION'
& $adb -s $appareil logcat -d -t 1500 |
  Where-Object { $_ -match "\s$pidApp\s" } |
  Select-Object -Last 30 |
  ForEach-Object { $_ }
