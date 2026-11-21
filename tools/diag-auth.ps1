$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
Write-Output '---ACTIVITE'
& $adb -s $appareil shell "dumpsys activity activities | grep -m1 ResumedActivity"
Write-Output '---JOURNAL-AUTH'
& $adb -s $appareil logcat -d -t 2000 |
  Select-String -Pattern 'auth\]','ReactNativeJS','oauthredirect','accounts.google','error=','client_id' |
  Select-Object -Last 30 |
  ForEach-Object { $_.Line }
