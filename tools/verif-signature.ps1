$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:PATH = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH

$apk = 'C:\Dev\MonFluxApp\android\app\build\outputs\apk\debug\app-debug.apk'
$outils = Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools') -Directory |
  Sort-Object Name -Descending | Select-Object -First 1
$apksigner = Join-Path $outils.FullName 'apksigner.bat'
& $apksigner verify --print-certs $apk 2>&1 | Select-String -Pattern 'SHA-1'
