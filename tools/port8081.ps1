$c = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
foreach ($x in $c) {
  $p = Get-Process -Id $x.OwningProcess -ErrorAction SilentlyContinue
  Write-Output ("PID {0} : {1}" -f $x.OwningProcess, $p.ProcessName)
}
