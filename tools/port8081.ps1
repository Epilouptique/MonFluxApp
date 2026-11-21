foreach ($port in 8081, 8082, 8083) {
  $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($c) {
    foreach ($x in $c) {
      $p = Get-Process -Id $x.OwningProcess -ErrorAction SilentlyContinue
      Write-Output ("port {0} : PID {1} ({2})" -f $port, $x.OwningProcess, $p.ProcessName)
    }
  } else {
    Write-Output ("port {0} : libre" -f $port)
  }
}
