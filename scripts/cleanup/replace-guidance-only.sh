#!/bin/bash

# Backup existing file if needed
if [ -f "packages/gnc-core/src/launch/guidance.ts" ]; then
  echo "Backing up corrupted guidance.ts..."
  cp packages/gnc-core/src/launch/guidance.ts packages/gnc-core/src/launch/guidance-corrupted-backup-$(date +%s).ts
fi

# Replace with clean version
echo "Replacing with clean guidance.ts..."
cp packages/gnc-core/src/launch/guidance-clean-complete.ts packages/gnc-core/src/launch/guidance.ts

echo "✅ guidance.ts has been replaced with clean version"
