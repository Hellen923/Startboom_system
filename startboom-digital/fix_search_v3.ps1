$files = @(
  'frontend\src\pages\agent\Contacts.js',
  'frontend\src\pages\agent\Clients.js',
  'frontend\src\pages\agent\Leads.js',
  'frontend\src\pages\agent\Deals.js',
  'frontend\src\pages\agent\Sales.js',
  'frontend\src\pages\agent\Tasks.js',
  'frontend\src\pages\agent\Issues.js',
  'frontend\src\pages\agent\Schedules.js',
  'frontend\src\pages\admin\UserManagement.js',
  'frontend\src\pages\admin\BulkOperations.js',
  'frontend\src\pages\admin\Products.js',
  'frontend\src\pages\admin\Territories.js'
)

# The correct single-line icon replacement
$iconReplacement = '<Search size={18} className="pointer-events-none" style={{position:"absolute",left:"1rem",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-placeholder)"}} />'

foreach ($f in $files) {
  if (-not (Test-Path $f)) { Write-Host "SKIP: $f"; continue }
  $c = Get-Content $f -Raw

  # Replace ANY multi-line or single-line Search icon that has inline style (our previous fix)
  # This collapses it to a single clean line with size={18}
  $c = [regex]::Replace($c, 
    '<Search[^/]*?style=\{\{position:"absolute"[^}]*\}[^}]*\}[^/]*/>', 
    $iconReplacement,
    [System.Text.RegularExpressions.RegexOptions]::Singleline)

  # Also fix any remaining className-based absolute Search icons
  $c = [regex]::Replace($c,
    '<Search[^/]*?className="[^"]*absolute[^"]*"[^/]*/>', 
    $iconReplacement,
    [System.Text.RegularExpressions.RegexOptions]::Singleline)

  # Ensure all search inputs have pl-12 (not pl-8, pl-9, pl-10, pl-11)
  $c = [regex]::Replace($c, '\bpl-(8|9|10|11)\b', 'pl-12')

  Set-Content $f $c -NoNewline
  Write-Host "Fixed: $f"
}
