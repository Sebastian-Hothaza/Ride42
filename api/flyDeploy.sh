#!/bin/bash

# Automates deployment to Fly.io upon API update

if [ -f "/.dockerenv" ]; then
  echo "❌ This script is running inside a Docker container. Aborting."
  exit 1
fi

REPO_DIR="/home/seb/repos/Ride42/api"
FLY_MACHINE_ID="1857501f1034d8"

cd "$REPO_DIR" || { echo "❌ Repo directory $REPO_DIR not found. Aborting."; exit 1; }

if ! command -v flyctl &> /dev/null; then
  echo "❌ flyctl is not installed or not in PATH. Aborting."
  exit 1
fi

if ! flyctl auth whoami &>/dev/null; then
  echo "❌ Not logged into Fly.io. Run 'flyctl auth login'."
  exit 1
fi

VERSION=$(git rev-parse --short HEAD)
export VERSION

echo "🌎 Deploying on Fly.io..."

if ! flyctl deploy --build-arg VERSION="$VERSION" &>/dev/null; then
  echo "❌ Fly deploy failed."
  exit 1
fi

if ! flyctl machines update "$FLY_MACHINE_ID" --autostop='off' -y &>/dev/null; then
  echo "❌ Failed to update Fly machine."
  exit 1
fi

echo "🚀 Deployment to Fly.io complete!"
