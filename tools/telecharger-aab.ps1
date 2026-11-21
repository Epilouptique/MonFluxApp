# AAB de production versionCode 3, build EAS 7e05b239. Hors du depot : un binaire
# n'a rien a y faire.
$dossier = 'C:\Dev\monflux-aab'
$cible = Join-Path $dossier 'monflux-v1.0.0-vc3.aab'
$url = 'https://expo.dev/artifacts/eas/av8PfgvLFngWfPbxWQW1guXhSSuE4qzrHXJzTWhhD4s.aab'

New-Item -ItemType Directory -Force -Path $dossier | Out-Null
Invoke-WebRequest -Uri $url -OutFile $cible
$fichier = Get-Item $cible
Write-Output ('{0}  ({1:N1} Mo)' -f $fichier.FullName, ($fichier.Length / 1MB))
