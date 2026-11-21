# Publie une release GitHub avec l'APK en piece jointe, pour installation directe
# ou via Obtainium. Voir docs/distribution-directe.md.
#
#   .\tools\publier-release.ps1 -Apk C:\chemin\vers\monflux.apk
#
# -Brouillon publie la release en brouillon, pour la relire avant de la rendre visible.

param(
  [Parameter(Mandatory = $true)][string]$Apk,
  [switch]$Brouillon
)

$ErrorActionPreference = 'Stop'
Set-Location 'C:\Dev\MonFluxApp'

if (-not (Test-Path $Apk)) { throw "APK introuvable : $Apk" }

# La version fait foi dans app.config.js : pas de numero saisi a la main, donc pas de
# divergence possible entre le binaire et l'etiquette.
$config = [System.IO.File]::ReadAllText('C:\Dev\MonFluxApp\app.config.js')
if ($config -notmatch "version:\s*'([0-9]+\.[0-9]+\.[0-9]+)'") {
  throw "Version introuvable dans app.config.js."
}
$version = $Matches[1]
$etiquette = "v$version"
Write-Output "Version : $version"

# --untracked-files=no : les fichiers non suivis (outils locaux) ne font pas partie du
# code publie et n'ont pas a bloquer la publication.
if ((git status --porcelain --untracked-files=no) -ne $null) {
  throw "Le depot a des modifications non committees. Committe d'abord : l'etiquette doit designer exactement le code publie."
}

if ((git tag --list $etiquette) -ne $null) {
  throw "L'etiquette $etiquette existe deja. Incremente la version dans app.config.js."
}

# Verification de signature : un APK signe par une autre cle que celle d'EAS ne
# pourrait pas se connecter, le client OAuth etant lie a l'empreinte.
$EMPREINTE_EAS = '6824380370 1b618d6cd3 cafc8595e7 b3c7797b13'.Replace(' ', '')
$outils = Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools') -Directory |
  Sort-Object Name -Descending | Select-Object -First 1
if ($outils) {
  $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
  $env:PATH = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
  $sortie = & (Join-Path $outils.FullName 'apksigner.bat') verify --print-certs $Apk 2>&1
  $ligne = $sortie | Select-String -Pattern 'SHA-1 digest' | Select-Object -First 1
  if ($ligne) {
    $empreinte = ($ligne -replace '.*:\s*', '').Trim().ToLower()
    if ($empreinte -ne $EMPREINTE_EAS.ToLower()) {
      Write-Warning "L'APK n'est pas signe par la cle EAS ($empreinte)."
      Write-Warning "La connexion Google y echouera : le client OAuth est lie a l'empreinte de la cle."
      $reponse = Read-Host 'Continuer quand meme ? (o/N)'
      if ($reponse -ne 'o') { throw 'Publication annulee.' }
    } else {
      Write-Output 'Signature : cle EAS, conforme au client OAuth.'
    }
  }
}

# Notes de version : on reprend le changelog deja ecrit pour les magasins plutot que
# d'en maintenir un second.
$changelogs = Get-ChildItem 'fastlane\metadata\android\fr-FR\changelogs\*.txt' -ErrorAction SilentlyContinue |
  Sort-Object { [int]($_.BaseName) } -Descending
$notes = if ($changelogs) { [System.IO.File]::ReadAllText($changelogs[0].FullName).Trim() } else { "Version $version." }

$notes = @"
$notes

## Installation

Telecharger l'APK ci-dessous et l'ouvrir sur l'appareil. Android demandera
l'autorisation d'installer depuis cette source.

Pour recevoir les mises a jour automatiquement, ajouter ce depot dans
[Obtainium](https://github.com/ImranR98/Obtainium) :
``https://github.com/Epilouptique/MonFluxApp``

Cette application n'est pas distribuee par F-Droid : elle depend des services Google
Play pour la connexion, ce que leur politique interdit. Voir ``docs/f-droid.md``.
"@

$nom = "monflux-$version.apk"
$copie = Join-Path $env:TEMP $nom
Copy-Item $Apk $copie -Force

git tag -a $etiquette -m "Mon Flux $version"
git push origin $etiquette

$arguments = @('release', 'create', $etiquette, $copie,
  '--title', "Mon Flux $version",
  '--notes', $notes)
if ($Brouillon) { $arguments += '--draft' }

& gh @arguments
Write-Output ''
& gh release view $etiquette --json url, isDraft, assets
