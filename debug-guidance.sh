#!/bin/bash

echo "Checking for hidden characters and syntax errors in guidance.ts..."

# Check line 281 specifically
sed -n '281p' /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance.ts | cat -A

echo "Line 281 content shown above with all characters visible"

echo "Checking lines 279-285:"
sed -n '279,285p' /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance.ts

echo "Checking around line 303:"
sed -n '301,305p' /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance.ts

echo "Checking around line 321:"
sed -n '319,325p' /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance.ts
