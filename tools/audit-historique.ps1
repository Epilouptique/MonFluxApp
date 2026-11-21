Set-Location 'C:\Dev\MonFluxApp'

Write-Output '=== OCCURRENCES ACTUELLES ==='
Get-ChildItem 'tools\sonde.mjs','tools\shorts.mjs','src\auth.ts' |
  Select-String -Pattern 'client_secret', 'refresh_token', 'CLIENT_SECRET' |
  ForEach-Object { '{0}:{1}  {2}' -f $_.Filename, $_.LineNumber, $_.Line.Trim() }

Write-Output ''
Write-Output '=== VALEURS LITTERALES SUSPECTES DANS TOUT L HISTORIQUE ==='
# Un secret de client Google commence par GOCSPX- ; un jeton de rafraichissement par 1//
$motifs = 'GOCSPX-', '1//0', 'ya29\.'
foreach ($m in $motifs) {
  $r = git grep -I -n -E $m $(git rev-list --all) 2>$null | Select-Object -First 5
  if ($r) { Write-Output ('  !! ' + $m); $r | ForEach-Object { Write-Output ('     ' + $_) } }
  else { Write-Output ('  ok  ' + $m + ' : aucune occurrence') }
}
