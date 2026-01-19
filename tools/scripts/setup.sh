#!/usr/bin/env bash
set -euo pipefail

# Bootstrap workspace
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Please install pnpm: https://pnpm.io/installation" >&2
  exit 1
fi

pnpm install

# Frontend dev quick start
cat <<'EON'
Next steps:
  pnpm dev            # run the web app
  pnpm build          # build all packages/apps
EON
