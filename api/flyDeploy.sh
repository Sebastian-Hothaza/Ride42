#!/bin/bash

# Automates deployment to Fly.io upon API update

REPO_DIR="/srv/rootMount/repos/Ride42/api"
FLY_MACHINE_ID="1857501f1034d8"

cd "$REPO_DIR" || { echo "❌ Repo directory $REPO_DIR not found. Aborting."; exit 1; }

VERSION=$(git rev-parse --short HEAD)
export VERSION

fly deploy --build-arg VERSION="$VERSION" &>/dev/null
flyctl machines update "$FLY_MACHINE_ID" --autostop='off' -y

echo "🚀 Deployment to Fly.io complete!"