#!/bin/bash

# Automates deployment to Fly.io upon API update
# Runs Jest tests before deploying, continues automatically even if tests fail

REPO_DIR="/srv/rootMount/repos/Ride42/api"
FLY_MACHINE_ID="1857501f1034d8"

# ---------------------------
# Run Jest tests first
# ---------------------------
echo "🧪 Running Jest tests..."
cd "$REPO_DIR" || exit 1

jest --ci --maxWorkers=4 &>/dev/null
JEST_EXIT_CODE=$?

if [ $JEST_EXIT_CODE -ne 0 ]; then
  echo "❌ Jest tests failed."
  
  # Prompt user
  read -p "Do you want to deploy anyway? (y/n) " answer
  case "$answer" in
    y|Y )
      echo "⚠️ Continuing deployment despite test failures..."
      ;;
    * )
      echo "🚫 Deployment aborted due to failing tests."
      exit 1
      ;;
  esac
else
  echo "✅ All Jest tests passed. Continuing deployment..."
fi

# Get short git hash for version
VERSION=$(git rev-parse --short HEAD)
export VERSION

# Deploy via Fly
fly deploy --build-arg VERSION="$VERSION" &>/dev/null

# Update Fly machine (autostop off)
flyctl machines update "$FLY_MACHINE_ID" --autostop='off' -y

echo "🚀 Deployment to Fly.io complete!"
