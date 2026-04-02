#!/bin/bash
set -e

if [ -f "/.dockerenv" ]; then
  echo "❌ This script is running inside a Docker container. Aborting."
  exit 1
fi

# ---------- Config ----------
CONTAINER_NAME="webdev"
CONTAINER_API_PATH="/workspace/Ride42/api"

# ---------- Check if container is running ----------
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Docker container '${CONTAINER_NAME}' is not running. Aborting."
    exit 1
fi

echo "🧪 Running Jest tests inside container..."

docker exec -w "$CONTAINER_API_PATH" "$CONTAINER_NAME" \
    npx jest --ci --maxWorkers=4 &>/dev/null || {
    
    echo "❌ Jest tests failed."
    read -n 1 -p "Deploy anyway? (y/n) " answer
    echo
    [[ "$answer" =~ ^[Yy]$ ]] || exit 1
}

echo "✅ Proceeding with deployments..."

./dockerDeploy.sh
./flyDeploy.sh