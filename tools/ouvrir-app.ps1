# Fait passer Metro par le cable USB plutot que par le reseau : evite toute
# question de pare-feu quand Expo bascule sur un port inhabituel.
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appareil = 'PT99651AA1111403004'
$port = 8083

& $adb -s $appareil reverse ("tcp:{0}" -f $port) ("tcp:{0}" -f $port)
Write-Output ('Tunnel USB etabli sur le port {0}' -f $port)

$lien = 'exp+monflux://expo-development-client/?url=http%3A%2F%2Flocalhost%3A{0}' -f $port
& $adb -s $appareil shell am start -a android.intent.action.VIEW -d $lien
