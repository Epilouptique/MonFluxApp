$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'

Write-Output '---PROCESSUS'
& $adb -s $appareil shell pidof fr.dahuconcept.monflux
Write-Output '---ACTIVITE AU PREMIER PLAN'
& $adb -s $appareil shell "dumpsys activity activities | grep -m1 ResumedActivity"
Write-Output '---TUNNELS ADB'
& $adb -s $appareil reverse --list
Write-Output '---METRO VU DEPUIS LE TELEPHONE'
& $adb -s $appareil shell "curl -s -o /dev/null -w '%{http_code}' http://localhost:8088/status"
Write-Output ''
Write-Output '---METRO VU DEPUIS LE PC'
try { (Invoke-WebRequest -Uri 'http://localhost:8088/status' -TimeoutSec 10).Content } catch { $_.Exception.Message }
