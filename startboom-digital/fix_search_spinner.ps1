$files = @(
  'frontend\src\pages\agent\Tasks.js',
  'frontend\src\pages\agent\Issues.js',
  'frontend\src\pages\agent\Schedules.js',
  'frontend\src\pages\agent\Clients.js',
  'frontend\src\pages\agent\Contacts.js',
  'frontend\src\pages\agent\Leads.js',
  'frontend\src\pages\agent\Deals.js',
  'frontend\src\pages\agent\Sales.js'
)

foreach ($f in $files) {
  $c = Get-Content $f -Raw
  # Fix line-broken Search icon classNames - join split absolute positioning classes
  $c = $c -replace '(pointer-events-none absolute left-\d+ top-1/2)\s*[\r\n]+\s*(-translate-y-1/2)', '$1 $2'
  # Fix all spinners to use theme color
  $c = $c -replace 'border-b-2 border-indigo-500', 'border-b-2 border-[var(--primary-color)]'
  $c = $c -replace 'border-t-2 border-indigo-500', 'border-t-2 border-[var(--primary-color)]'
  $c = $c -replace 'border-t-primary-600', 'border-t-[var(--primary-color)]'
  Set-Content $f $c -NoNewline
  Write-Host "Fixed: $f"
}
