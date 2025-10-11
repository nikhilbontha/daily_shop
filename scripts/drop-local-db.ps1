param(
  [switch]$Yes
)

$node = (Get-Command node).Source
if (-not $node) {
  Write-Error "Node.js not found in PATH. Install Node.js to run the script."
  exit 2
}

$env:MONGO_URI = $env:MONGO_URI # keep existing if set
if ($Yes) {
  & $node "$(Join-Path $PSScriptRoot 'drop-local-db.js')" -y
} else {
  & $node "$(Join-Path $PSScriptRoot 'drop-local-db.js')"
}
