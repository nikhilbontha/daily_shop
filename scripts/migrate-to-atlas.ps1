<#
PowerShell script to migrate a local MongoDB database to MongoDB Atlas using mongodump/mongorestore.

Prerequisites:
- Install MongoDB Database Tools (provides mongodump/mongorestore).
- Have your Atlas connection string (with username and URL-encoded password).
- Allow your IP in Atlas Network Access or use temporary 0.0.0.0/0 (not recommended long-term).

Usage:
1. Edit the variables below: $LocalDbName, $AtlasUri, $DumpDir
2. Run in PowerShell:
   .\migrate-to-atlas.ps1
#>

param(
   [string]$LocalDbName = '',
   [string]$AtlasUri = ''
)

# Allow interactive prompts if parameters not provided
if (-not $LocalDbName) {
   $LocalDbName = Read-Host "Enter your local database name (default: dailyshop)"
}
if (-not $LocalDbName) { $LocalDbName = 'dailyshop'; Write-Host "Using default DB name: $LocalDbName" }

if (-not $AtlasUri) {
   $AtlasUri = Read-Host "Enter your Atlas connection string (mongodb+srv://... with URL-encoded password)"
}
if (-not $AtlasUri) { Write-Host "No Atlas URI provided. Exiting."; exit 1 }

$DumpDir = Join-Path $PSScriptRoot "dump_$LocalDbName"
if (Test-Path $DumpDir) { Remove-Item -Recurse -Force $DumpDir }

Write-Host "Dumping local database '$LocalDbName' to $DumpDir"
Write-Host "Checking for MongoDB Database Tools (mongodump, mongorestore)..."
if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) {
   Write-Host "mongodump not found in PATH. Please install MongoDB Database Tools:
 - Windows: https://www.mongodb.com/docs/database-tools/installation/ or install via Chocolatey: choco install mongodb-database-tools
 - Or download the appropriate archive and add it to your PATH.";
   exit 2
}
if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
   Write-Host "mongorestore not found in PATH. Please install MongoDB Database Tools as above.";
   exit 2
}

$dumpCmd = "mongodump --db $LocalDbName --out `"$DumpDir`""
Write-Host $dumpCmd
$dumpRes = & mongodump --db $LocalDbName --out $DumpDir 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "mongodump failed:`n$dumpRes"; exit 1 }
Write-Host "Dump complete. Files in: $DumpDir"

Write-Host "Restoring to Atlas (this may take a while)"
# mongorestore to a MongoDB Atlas cluster via the SRV connection requires --uri
$restoreCmd = "mongorestore --uri `"$AtlasUri`" --nsInclude $LocalDbName.* `"$DumpDir\$LocalDbName`" --drop"
Write-Host $restoreCmd
$restoreRes = & mongorestore --uri $AtlasUri --nsInclude "$LocalDbName.*" "$DumpDir\$LocalDbName" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "mongorestore failed:`n$restoreRes"; exit 1 }
Write-Host "Restore complete. Verify in MongoDB Atlas UI or MongoDB Compass."

Write-Host "Done. Recommended next steps:"
Write-Host " - Verify data in Atlas via MongoDB Compass or Atlas web UI"
Write-Host " - Update your deployed app's MONGO_URI to point to Atlas (URL-encode password)"
Write-Host " - Test the app's /api/test endpoint to ensure dbStatus is 'connected'"
