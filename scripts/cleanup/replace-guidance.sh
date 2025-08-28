#!/bin/bash

# Replace the corrupted guidance.ts completely
echo "Replacing guidance.ts with clean version..."

cd /workspaces/gnc-space-sim/packages/gnc-core/src/launch

# Copy the guidance-final.ts to the correct location as guidance.ts
cp /workspaces/gnc-space-sim/guidance-final.ts ./guidance.ts

echo "Guidance file replaced successfully!"
echo "Now running TypeScript check..."

cd /workspaces/gnc-space-sim
pnpm typecheck
