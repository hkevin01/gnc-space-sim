#!/bin/bash

# Backup the corrupted file
mv /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance.ts /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance-corrupted.ts

# Copy the clean version
cp /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance-clean.ts /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance.ts

echo "Replaced corrupted guidance.ts with clean version"
