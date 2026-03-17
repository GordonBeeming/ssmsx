$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# Determine platform triple
$Triple = (rustc -vV | Select-String "host:").ToString().Split(" ")[1]

Write-Host "Building sidecar for $Triple..."

# Map Rust triple to .NET RID
$RID = switch ($Triple) {
    "x86_64-pc-windows-msvc"     { "win-x64" }
    "aarch64-pc-windows-msvc"    { "win-arm64" }
    "x86_64-apple-darwin"        { "osx-x64" }
    "aarch64-apple-darwin"       { "osx-arm64" }
    "x86_64-unknown-linux-gnu"   { "linux-x64" }
    "aarch64-unknown-linux-gnu"  { "linux-arm64" }
    default { throw "Unknown triple: $Triple" }
}

# Build the sidecar with RID for AOT publish
dotnet publish "$RootDir\sidecar\src\Ssmsx.Sidecar" `
  -c Debug `
  -r $RID `
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
