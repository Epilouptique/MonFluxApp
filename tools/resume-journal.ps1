Get-Content 'C:\Dev\MonFluxApp\tools\journal-build.txt' -Tail 12
Write-Output '---PAQUET-SUR-APPAREIL'
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
& $adb -s PT99651AA1111403004 shell pm list packages fr.dahuconcept.monflux
