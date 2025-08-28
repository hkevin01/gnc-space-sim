#!/bin/bash

echo "🔧 Creating clean guidance.ts file..."

# Create backup of existing corrupted file
echo "Creating backup..."
cp packages/gnc-core/src/launch/guidance.ts packages/gnc-core/src/launch/guidance-corrupted-$(date +%s).ts

# Remove existing corrupted file
echo "Removing corrupted file..."
rm packages/gnc-core/src/launch/guidance.ts

# Copy clean version
echo "Installing clean version..."
cp packages/gnc-core/src/launch/guidance-final-clean.ts packages/gnc-core/src/launch/guidance.ts

echo "✅ Clean guidance.ts file installed!"

# Verify file
echo "File verification:"
wc -l packages/gnc-core/src/launch/guidance.ts
head -5 packages/gnc-core/src/launch/guidance.ts
