#!/bin/bash
set -e

echo "🧪 Running Jest tests..."
cd /srv/rootMount/repos/Ride42/api

npx jest --ci --maxWorkers=4 &>/dev/null || {
  echo "❌ Jest tests failed."
  read -n 1 -p "Deploy anyway? (y/n) " answer
  echo
  [[ "$answer" =~ ^[Yy]$ ]] || exit 1
}

echo "✅ Proceeding with deployments..."

./dockerDeploy.sh
./flyDeploy.sh
