$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# Determine platform triple
$Triple = (rustc -vV | Select-String "host:").ToString().Split(" ")[1]

Write-Host "Building sidecar for $Triple..."

# Build the sidecar
dotnet publish "$RootDir\sidecar\src\Ssmsx.Sidecar" `
  -c Debug `
  -o "$RootDir\sidecar\bin\Debug\publish"

# Create sidecars directory
New-Item -ItemType Directory -Force -Path "$RootDir\src-tauri\sidecars" | Out-Null

# Copy with platform-specific name
$Source = "$RootDir\sidecar\bin\Debug\publish\Ssmsx.Sidecar"
$Dest = "$RootDir\src-tauri\sidecars\ssmsx-sidecar-$Triple"

if ($Triple -like "*windows*") {
  $Source = "${Source}.exe"
  $Dest = "${Dest}.exe"
}

Copy-Item $Source $Dest -Force
Write-Host "Sidecar copied to: $Dest"
