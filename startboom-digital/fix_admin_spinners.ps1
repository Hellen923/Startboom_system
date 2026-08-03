$files = @(
  'frontend\src\pages\admin\Reports.js',
  'frontend\src\pages\admin\Analytics.js',
  'frontend\src\pages\admin\PermissionManager.js',
  'frontend\src\pages\admin\Targets.js',
  'frontend\src\pages\admin\TenantSettings.js',
  'frontend\src\pages\admin\Settings.js',
  'frontend\src\pages\admin\Products.js',
  'frontend\src\components\LoadingSpinner.js',
  'frontend\src\components\SearchBar.js'
)

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "SKIP (not found): $f"; continue }
  $c = Get-Content $f -Raw
  # Fix hardcoded gold spinner
  $c = $c -replace 'border-\[#FFD700\]', 'border-[var(--primary-color)]'
  # Fix indigo spinners
  $c = $c -replace 'border-b-2 border-indigo-500', 'border-b-2 border-[var(--primary-color)]'
  $c = $c -replace 'border-indigo-500', 'border-[var(--primary-color)]'
  # Fix focus:border-indigo in SearchBar
  $c = $c -replace 'focus:border-indigo-500', 'focus:border-[var(--primary-color)]'
  $c = $c -replace 'focus:ring-indigo-500', 'focus:ring-primary-500'
  # Fix line-broken Search icon classNames
  $c = $c -replace '(pointer-events-none absolute left-\d+ top-1/2)\s*[\r\n]+\s*(-translate-y-1/2)', '$1 $2'
  Set-Content $f $c -NoNewline
  Write-Host "Fixed: $f"
}
