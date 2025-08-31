#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_FILE="${HERE}/../src/App.tsx"
BACKUP_FILE="${APP_FILE}.backup"

echo "[guard-app] Checking App.tsx..."
echo "[guard-app] HERE: $HERE"
echo "[guard-app] APP_FILE: $APP_FILE"
echo "[guard-app] BACKUP_FILE: $BACKUP_FILE"

# If App.tsx is empty or missing but backup exists with content, restore it
if [[ ! -s "$APP_FILE" && -s "$BACKUP_FILE" ]]; then
  echo "[guard-app] Restoring from backup..."
  cp "$BACKUP_FILE" "$APP_FILE"
  echo "[guard-app] ✅ Restored App.tsx from backup"
elif [[ ! -s "$APP_FILE" ]]; then
  # If App.tsx is empty and no backup, write a minimal default-export component
  echo "[guard-app] Writing minimal placeholder..."
  cat > "$APP_FILE" <<'TSX'
import React from 'react'
export default function App() { return <div style={{color:'#fff',background:'#000',height:'100vh'}}>App restored by guard</div> }
TSX
  echo "[guard-app] ✅ Wrote minimal App.tsx placeholder"
else
  echo "[guard-app] ✅ App.tsx is already present and non-empty"
fi
