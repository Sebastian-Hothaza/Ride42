#!/bin/bash

# Automates deployment to Fly.io upon API update
# Runs Jest only once per deployment session

REPO_DIR="/srv/rootMount/repos/Ride42/api"
FLY_MACHINE_ID="1857501f1034d8"

cd "$REPO_DIR" || { echo "❌ Repo directory $REPO_DIR not found. Aborting."; exit 1; }

# ---------------------------
# Run Jest tests first (once)
# ---------------------------
if [ -z "$JEST_ALREADY_RUN" ]; then
  echo "🧪 Running Jest tests..."
  
  jest --ci --maxWorkers=4 &>/dev/null
  JEST_EXIT_CODE=$?

  export JEST_ALREADY_RUN=true

  if [ $JEST_EXIT_CODE -ne 0 ]; then
    echo "❌ Jest tests failed."
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
else
  echo "⚠️ Jest already ran, skipping tests..."
fi

# ---------------------------
# Deploy to Fly.io
# ---------------------------
VERSION=$(git rev-parse --short HEAD)
export VERSION

fly deploy --build-arg VERSION="$VERSION" &>/dev/null
flyctl machines update "$FLY_MACHINE_ID" --autostop='off' -y

echo "🚀 Deployment to Fly.io complete!"
