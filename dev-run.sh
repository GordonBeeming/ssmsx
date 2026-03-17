#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Build the C# sidecar first
echo "=== Building sidecar ==="
"$SCRIPT_DIR/build/dev-sidecar.sh"

# Enable Rust logging (default to info if not already set)
export RUST_LOG="${RUST_LOG:-info}"

echo ""
echo "=== Starting Tauri dev (RUST_LOG=$RUST_LOG) ==="

# Trap SIGINT for clean shutdown
trap 'echo ""; echo "Shutting down..."; kill 0 2>/dev/null; exit 0' INT TERM

# Run Tauri dev (starts Vite + Tauri native window)
cd "$SCRIPT_DIR"
cargo tauri dev
