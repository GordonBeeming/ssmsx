#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Determine platform triple
TRIPLE=$(rustc -vV | grep host | cut -d' ' -f2)

echo "Building sidecar for $TRIPLE..."

# Build the sidecar
dotnet publish "$ROOT_DIR/sidecar/src/Ssmsx.Sidecar" \
  -c Debug \
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
