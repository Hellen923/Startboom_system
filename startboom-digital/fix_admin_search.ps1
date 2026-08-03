$files = @(
  'frontend\src\pages\admin\BulkOperations.js',
  'frontend\src\pages\admin\Products.js',
  'frontend\src\pages\admin\Territories.js',
  'frontend\src\pages\admin\UserManagement.js'
)

$fixedStyle = 'className="pointer-events-none" style={{position:"absolute",left:"1rem",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-placeholder)"}}'

# All variants of the broken pattern
$patterns = @(
  'className="pointer-events-none absolute left-\d+ top-1/2 -translate-y-1/2[^"]*"',
  'className="pointer-events-none absolute left-\d+ top-1/2\s*[\r\n\s]+-translate-y-1/2[^"]*"',
  'className="pointer-events-none absolute left-\d+ top-1/2 transform -translate-y-1/2[^"]*"',
  'className="absolute left-\d+ top-1/2 transform -translate-y-1/2[^"]*"'
)

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "SKIP: $f"; continue }
  $c = Get-Content $f -Raw
  $before = $c.Length
  foreach ($p in $patterns) {
    $c = [regex]::Replace($c, $p, $fixedStyle)
  }
  if ($c.Length -ne $before) {
    Set-Content $f $c -NoNewline
    Write-Host "Fixed: $f"
  } else {
    Write-Host "No match: $f"
  }
}
