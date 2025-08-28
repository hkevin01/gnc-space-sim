#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Marking repo scripts as executable..."
find "$ROOT_DIR/scripts" -maxdepth 1 -type f -name "*.sh" -print -exec chmod +x {} \;

if [ -f "$ROOT_DIR/run.sh" ]; then
  chmod +x "$ROOT_DIR/run.sh"
fi

echo "Done. You can now run:"
echo "  ./run.sh"
echo "  ./scripts/docker-dev.sh dev:start"
