#!/bin/bash

if [ -f "/.dockerenv" ]; then
  echo "❌ This script is running inside a Docker container. Aborting."
  exit 1
fi


# ---------- Config ----------
CONTAINER_NAME="webdev"
CONTAINER_APP_PATH="/workspace/Ride42/app"
TARGET_DIR="/srv/ride42-demo"
USER_NAME="$USER"   # current user

# ---------- Check if container is running ----------
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Docker container '${CONTAINER_NAME}' is not running. Aborting."
    exit 1
fi

# ---------- Build in container ----------
echo "🔧 Building frontend inside container..."
docker exec -w "$CONTAINER_APP_PATH" "$CONTAINER_NAME" npm run build_local &>/dev/null

# ---------- Prepare target folder ----------
echo "🧹 Preparing target folder..."
sudo mkdir -p "$TARGET_DIR"           # ensure folder exists
sudo rm -rf "$TARGET_DIR"/*           # clear previous build
sudo chown "$USER_NAME":"$USER_NAME" "$TARGET_DIR"  # make it writable by current user

# ---------- Copy build from container ----------
echo "📤 Copying build to $TARGET_DIR..."
docker cp "$CONTAINER_NAME":"$CONTAINER_APP_PATH/dist/." "$TARGET_DIR"/ &>/dev/null

echo "✅ Deployment complete. Build is now in $TARGET_DIR"
