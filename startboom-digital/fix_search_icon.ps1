$files = @(
  'frontend\src\pages\agent\Tasks.js',
  'frontend\src\pages\agent\Issues.js',
  'frontend\src\pages\agent\Schedules.js',
  'frontend\src\pages\agent\Clients.js',
  'frontend\src\pages\agent\Contacts.js',
  'frontend\src\pages\agent\Leads.js',
  'frontend\src\pages\agent\Deals.js',
  'frontend\src\pages\agent\Sales.js',
  'frontend\src\pages\admin\UserManagement.js',
  'frontend\src\pages\admin\Reports.js',
  'frontend\src\pages\admin\Analytics.js',
  'frontend\src\pages\admin\Targets.js',
  'frontend\src\pages\admin\Dashboard.js'
)

# The broken pattern: className has a line break inside it between top-1/2 and -translate-y-1/2
# Replace the entire broken className with a clean inline style version
$brokenPattern = 'className="pointer-events-none absolute left-4 top-1/2\s*[\r\n\s]+-translate-y-1/2[^"]*"'
$fixedStyle = 'className="pointer-events-none" style={{position:"absolute",left:"1rem",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-placeholder)"}}'

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "SKIP: $f"; continue }
  $c = Get-Content $f -Raw
  $before = $c.Length
  $c = [regex]::Replace($c, $brokenPattern, $fixedStyle)
  if ($c.Length -ne $before) {
    Set-Content $f $c -NoNewline
    Write-Host "Fixed: $f"
  } else {
    Write-Host "No match: $f"
  }
}
