#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Determine platform triple
TRIPLE=$(rustc -vV | grep host | cut -d' ' -f2)

echo "Building sidecar for $TRIPLE..."

# Map Rust triple to .NET RID
case "$TRIPLE" in
  aarch64-apple-darwin)       RID="osx-arm64" ;;
  x86_64-apple-darwin)        RID="osx-x64" ;;
  x86_64-unknown-linux-gnu)   RID="linux-x64" ;;
  aarch64-unknown-linux-gnu)  RID="linux-arm64" ;;
  x86_64-pc-windows-msvc)     RID="win-x64" ;;
  *) echo "Unknown triple: $TRIPLE"; exit 1 ;;
esac

# Build the sidecar with RID for AOT publish
dotnet publish "$ROOT_DIR/sidecar/src/Ssmsx.Sidecar" \
  -c Debug \
  -r "$RID" \
  -o "$ROOT_DIR/sidecar/bin/Debug/publish"

# Create sidecars directory
mkdir -p "$ROOT_DIR/src-tauri/sidecars"

# Copy with platform-specific name
SOURCE="$ROOT_DIR/sidecar/bin/Debug/publish/Ssmsx.Sidecar"
DEST="$ROOT_DIR/src-tauri/sidecars/ssmsx-sidecar-$TRIPLE"

# Add .exe on Windows
if [[ "$TRIPLE" == *"windows"* ]]; then
  SOURCE="${SOURCE}.exe"
  DEST="${DEST}.exe"
fi

cp "$SOURCE" "$DEST"
echo "Sidecar copied to: $DEST"
