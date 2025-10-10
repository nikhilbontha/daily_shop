# PowerShell helper to URL-encode a MongoDB Atlas password and show the full connection string

$Username = Read-Host "Atlas username"
$Password = Read-Host "Atlas password (will be URL-encoded)"
$Cluster = Read-Host "Cluster host (e.g. cluster0.c3jrfec.mongodb.net)"
$DbName = Read-Host "Default database name (optional, press Enter to skip)"

if (-not $Username -or -not $Password -or -not $Cluster) { Write-Host "Missing input. Exiting."; exit 1 }

# URL-encode the password
Add-Type -AssemblyName System.Web
$encoded = [System.Web.HttpUtility]::UrlEncode($Password)

if ($DbName) {
  $uri = "mongodb+srv://$Username:${encoded}@$Cluster/$DbName?retryWrites=true&w=majority"
} else {
  $uri = "mongodb+srv://$Username:${encoded}@$Cluster/?retryWrites=true&w=majority"
}

Write-Host "Encoded Atlas URI (copy into Render MONGO_URI env var):"
Write-Host $uri
