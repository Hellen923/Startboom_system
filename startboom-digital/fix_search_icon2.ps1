$files = @(
  'frontend\src\pages\agent\Schedules.js',
  'frontend\src\pages\agent\Clients.js',
  'frontend\src\pages\agent\Deals.js',
  'frontend\src\pages\admin\UserManagement.js',
  'frontend\src\pages\admin\Reports.js',
  'frontend\src\pages\admin\Analytics.js',
  'frontend\src\pages\admin\Targets.js',
  'frontend\src\pages\admin\Dashboard.js',
  'frontend\src\pages\admin\Departments.js'
)

# Pattern 1: uses "transform -translate-y-1/2" (may be on same line or split)
$p1 = 'className="pointer-events-none absolute left-(\d+) top-1/2 transform -translate-y-1/2[^"]*"'
$r1 = 'className="pointer-events-none" style={{position:"absolute",left:"1rem",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-placeholder)"}}'

# Pattern 2: same but with size before className (Schedules uses size={18} first)
$p2 = 'size=\{18\} className="pointer-events-none absolute left-(\d+) top-1/2 transform -translate-y-1/2[^"]*"'
$r2 = 'className="pointer-events-none" style={{position:"absolute",left:"1rem",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-placeholder)"}} size={18}'

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "SKIP: $f"; continue }
  $c = Get-Content $f -Raw
  $before = $c.Length
  $c = [regex]::Replace($c, $p2, $r2)
  $c = [regex]::Replace($c, $p1, $r1)
  if ($c.Length -ne $before) {
    Set-Content $f $c -NoNewline
    Write-Host "Fixed: $f"
  } else {
    Write-Host "No match: $f"
  }
}
