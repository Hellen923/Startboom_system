$files = @(
  'frontend\src\pages\agent\Tasks.js',
  'frontend\src\pages\agent\Issues.js'
)

foreach ($f in $files) {
  $c = Get-Content $f -Raw
  $c = $c -replace 'border-b-2 border-indigo-500', 'border-b-2 border-[var(--primary-color)]'
  $c = $c -replace 'focus:ring-indigo-500', 'focus:ring-primary-500'
  $c = $c -replace 'text-slate-400" size=\{18\} />', 'text-[var(--color-text-placeholder)]" size={18} />'
  Set-Content $f $c -NoNewline
  Write-Host "Fixed: $f"
}
