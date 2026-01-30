#!/bin/bash

# Automates deployment to Docker container upon API update
# Now uses Docker Compose instead of docker run

COMPOSE_DIR="/srv/ride42api"
REPO_DIR="/srv/rootMount/repos/Ride42/api"
SERVICE_NAME="api"
ENV_FILE="${REPO_DIR}/.env_docker"
HEALTHCHECK_URL="https://api2.ride42.ca"

VERSION=$(git -C ${REPO_DIR} rev-parse --short HEAD)
export VERSION

# Check for .env file
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file '$ENV_FILE' not found. Aborting deployment."
  exit 1
fi

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

# ---------------------------
# Build & deploy Docker
# ---------------------------
echo "🔧 Rebuilding Docker image via Docker Compose..."
docker compose -f ${COMPOSE_DIR}/docker-compose.yml build --no-cache >/dev/null

echo "🛑 Stopping old container (if exists)..."
docker compose -f ${COMPOSE_DIR}/docker-compose.yml down &>/dev/null

echo "🧹 Pruning unused Docker images..."
docker image prune -f &>/dev/null

echo "🚀 Starting new container via Docker Compose..."
docker compose -f ${COMPOSE_DIR}/docker-compose.yml up -d &>/dev/null

# Health check
echo "🔍 Checking API health at ${HEALTHCHECK_URL}..."
sleep 3  # Give the container a moment to start

if curl -s --head --request GET ${HEALTHCHECK_URL} | grep "200 OK" > /dev/null; then
  echo "✅ API is healthy and responding at ${HEALTHCHECK_URL}"
else
  echo "⚠️ API did not respond with 200 OK."
  echo "📄 Container logs:"
  docker compose -f ${COMPOSE_DIR}/docker-compose.yml logs ${SERVICE_NAME}
fi
