$motifs = 'BUILD SUCCESSFUL', 'BUILD FAILED', 'ninja: error', 'Installing', 'error:', 'FAILURE', 'cle-debug'
Select-String -Path 'C:\Dev\MonFluxApp\tools\journal-build.txt' -Pattern $motifs |
  Select-Object -Last 15 |
  ForEach-Object { $_.Line.Trim() }
