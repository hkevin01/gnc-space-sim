#!/bin/bash

echo "🔄 Replacing corrupted guidance.ts with clean version..."

cd /workspaces/gnc-space-sim/packages/gnc-core/src/launch

# Backup the corrupted file
echo "Creating backup..."
cp guidance.ts guidance-corrupted-backup.ts

# Replace with clean version
echo "Copying clean version..."
cp guidance-minimal.ts guidance.ts

echo "✅ File replaced successfully!"

# Verify the replacement worked
echo "Verifying file size..."
wc -l guidance.ts guidance-minimal.ts

echo "🧪 Testing TypeScript compilation..."
cd /workspaces/gnc-space-sim
pnpm typecheck --filter @gnc/core
