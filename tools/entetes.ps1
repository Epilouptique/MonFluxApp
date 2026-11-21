$racine = 'C:\Dev\MonFluxApp'
$utf8 = New-Object System.Text.UTF8Encoding $false

# On ne compare pas la chaine accentuee (l'encodage du script la trahit) : on repere
# la ligne de commentaire contenant « droits » et on la remplace entierement.
$nouvelleLigne = '// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE'

$dossiers = @('src', 'app', '__tests__', 'plugins') | ForEach-Object { Join-Path $racine $_ } | Where-Object { Test-Path $_ }
$fichiers = @(Get-ChildItem -Path $dossiers -Recurse -Include *.ts, *.tsx, *.js -File)
$fichiers += @(Get-ChildItem -Path $racine -Filter *.js -File)

$n = 0
foreach ($f in $fichiers) {
  $lignes = [System.IO.File]::ReadAllLines($f.FullName, $utf8)
  if ($lignes.Count -eq 0) { continue }
  $modifie = $false
  for ($i = 0; $i -lt [Math]::Min(3, $lignes.Count); $i++) {
    if ($lignes[$i] -match '^//.*droits') {
      $lignes[$i] = $nouvelleLigne
      $modifie = $true
    }
  }
  if ($modifie) {
    [System.IO.File]::WriteAllLines($f.FullName, $lignes, $utf8)
    $n++
    Write-Output ('  ' + $f.FullName.Substring($racine.Length + 1))
  }
}
Write-Output ("{0} fichier(s) mis a jour" -f $n)
