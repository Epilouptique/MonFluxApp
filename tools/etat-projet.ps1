Set-Location 'C:\Dev\MonFluxApp'

Write-Output '=== GIT ==='
git log --oneline -3
git status --short

Write-Output ''
Write-Output '=== CONFIGURATION DE LINT ==='
$lint = Get-ChildItem -Path . -Filter '.eslintrc*' -File -ErrorAction SilentlyContinue
$lint += Get-ChildItem -Path . -Filter 'eslint.config.*' -File -ErrorAction SilentlyContinue
if ($lint) { $lint | ForEach-Object { Write-Output ('  ' + $_.Name) } } else { Write-Output '  aucune' }

Write-Output ''
Write-Output '=== TAILLE DES SOURCES ==='
Get-ChildItem -Path 'src', 'app' -Recurse -Include *.ts, *.tsx -File |
  Sort-Object Length -Descending |
  Select-Object -First 15 |
  ForEach-Object {
    $chemin = $_.FullName.Replace('C:\Dev\MonFluxApp\', '')
    $lignes = [System.IO.File]::ReadAllLines($_.FullName).Count
    Write-Output ('{0,5} lignes   {1}' -f $lignes, $chemin)
  }

Write-Output ''
Write-Output '=== TESTS EXISTANTS ==='
Get-ChildItem '__tests__' -Recurse -File | ForEach-Object { Write-Output ('  ' + $_.Name) }

Write-Output ''
Write-Output '=== MODULES SANS TEST ==='
$testes = Get-ChildItem '__tests__' -Recurse -File | ForEach-Object { $_.BaseName -replace '\.test$', '' }
Get-ChildItem 'src' -Filter *.ts -File | ForEach-Object {
  if ($testes -notcontains $_.BaseName) { Write-Output ('  ' + $_.Name) }
}
