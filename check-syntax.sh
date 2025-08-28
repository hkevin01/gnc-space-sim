#!/bin/bash

# Check syntax of run.sh
echo "Checking run.sh syntax..."

# Check for bash syntax errors
bash -n /workspaces/gnc-space-sim/run.sh 2>&1 || echo "Syntax errors found"

# Count opening and closing braces
echo ""
echo "Brace analysis:"
echo -n "Opening braces { : "
grep -o '{' /workspaces/gnc-space-sim/run.sh | wc -l
echo -n "Closing braces } : "
grep -o '}' /workspaces/gnc-space-sim/run.sh | wc -l

echo ""
echo "Function analysis:"
echo -n "Function definitions: "
grep -c '^[[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*()' /workspaces/gnc-space-sim/run.sh || echo "0"

echo ""
echo "Conditional analysis:"
echo -n "if statements: "
grep -c '^[[:space:]]*if' /workspaces/gnc-space-sim/run.sh || echo "0"
echo -n "fi statements: "
grep -c '^[[:space:]]*fi' /workspaces/gnc-space-sim/run.sh || echo "0"

echo ""
echo "Case analysis:"
echo -n "case statements: "
grep -c '^[[:space:]]*case' /workspaces/gnc-space-sim/run.sh || echo "0"
echo -n "esac statements: "
grep -c '^[[:space:]]*esac' /workspaces/gnc-space-sim/run.sh || echo "0"
