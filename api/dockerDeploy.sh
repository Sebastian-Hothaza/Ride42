#!/bin/bash

# Automates deployment to Docker container upon API update
# Note: Builds for production environment

# CONFIGURATION
IMAGE_NAME="ride42_api"
IMAGE_TAG="latest"
CONTAINER_NAME="ride42_api_container"
PORT_MAPPING="3000:3000"
ENV_FILE=".env_docker"
HEALTHCHECK_URL="https://api2.ride42.ca"

# Check for .env file
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file '$ENV_FILE' not found. Aborting deployment."
  exit 1
fi

echo "🔧 Rebuilding Docker image..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .  &>/dev/null

echo "🛑 Stopping and removing old container (if exists)..."
docker stop ${CONTAINER_NAME} &>/dev/null
docker rm ${CONTAINER_NAME} &>/dev/null

echo "🧹 Pruning unused Docker images..."
docker image prune -f &>/dev/null

echo "🚀 Starting new container..."
docker run -d \
  --name ${CONTAINER_NAME} \
  --env-file ${ENV_FILE} \
  --restart unless-stopped \
  -p ${PORT_MAPPING} \
  ${IMAGE_NAME}:${IMAGE_TAG} \
  &>/dev/null
 
# Health check
echo "🔍 Checking API health at ${HEALTHCHECK_URL}..."
sleep 3  # Give the container a moment to start
if curl -s --head --request GET ${HEALTHCHECK_URL} | grep "200 OK" > /dev/null; then
  echo "✅ API is healthy and responding at ${HEALTHCHECK_URL}"
else
  echo "⚠️ API did not respond with 200 OK."
  echo "📄 Container logs from ${CONTAINER_NAME}:"
  docker logs ${CONTAINER_NAME}
fi