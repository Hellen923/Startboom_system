$agentFiles = @(
  'frontend\src\pages\agent\Contacts.js',
  'frontend\src\pages\agent\Clients.js',
  'frontend\src\pages\agent\Leads.js',
  'frontend\src\pages\agent\Deals.js',
  'frontend\src\pages\agent\Sales.js',
  'frontend\src\pages\agent\Tasks.js',
  'frontend\src\pages\agent\Issues.js',
  'frontend\src\pages\agent\Schedules.js'
)

$adminFiles = @(
  'frontend\src\pages\admin\UserManagement.js',
  'frontend\src\pages\admin\Reports.js',
  'frontend\src\pages\admin\Analytics.js',
  'frontend\src\pages\admin\Targets.js',
  'frontend\src\pages\admin\Dashboard.js',
  'frontend\src\pages\admin\Departments.js',
  'frontend\src\pages\admin\BulkOperations.js',
  'frontend\src\pages\admin\Products.js',
  'frontend\src\pages\admin\Territories.js'
)

$allFiles = $agentFiles + $adminFiles

foreach ($f in $allFiles) {
  if (-not (Test-Path $f)) { Write-Host "SKIP: $f"; continue }
  $c = Get-Content $f -Raw
  $before = $c

  # Fix 1: Any search input with pl-8, pl-9, pl-10, pl-11 -> pl-12 (ensures enough space for icon)
  $c = $c -replace '(type="text"[^>]*?placeholder="[^"]*[Ss]earch[^"]*"[^>]*?className="[^"]*?)pl-(?:8|9|10|11)\b', '${1}pl-12'
  $c = $c -replace '(className="[^"]*?)pl-(?:8|9|10|11)([^"]*?"[^>]*?placeholder="[^"]*[Ss]earch)', '${1}pl-12${2}'

  # Fix 2: Replace ALL search icon patterns with a clean wrapper approach
  # Pattern: <div className="relative..."> ... <Search ... /> <input ... />
  # Ensure the wrapper div has "relative" and icon has correct inline style
  
  # Replace any remaining broken absolute positioning on Search icons
  $c = [regex]::Replace($c, 
    '<Search([^/]*?)className="[^"]*?absolute[^"]*?"([^/]*?)/>', 
    '<Search$1className="pointer-events-none" style={{position:"absolute",left:"1rem",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-placeholder)"}}$2/>')

  if ($c -ne $before) {
    Set-Content $f $c -NoNewline
    Write-Host "Fixed: $f"
  } else {
    Write-Host "No change: $f"
  }
}
