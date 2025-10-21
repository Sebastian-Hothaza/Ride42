#!/bin/bash

# Automates deployment to docker container upon API update

# CONFIGURATION
IMAGE_NAME="my-api"
IMAGE_TAG="latest"
CONTAINER_NAME="my-api-container"
PORT_MAPPING="8080:8080"  # Adjust as needed

echo "🔧 Rebuilding Docker image..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

echo "🛑 Stopping and removing old container (if exists)..."
docker stop ${CONTAINER_NAME} 2>/dev/null
docker rm ${CONTAINER_NAME} 2>/dev/null

echo "🚀 Starting new container..."
docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${PORT_MAPPING} \
  ${IMAGE_NAME}:${IMAGE_TAG}

echo "✅ Redeployment complete. Container '${CONTAINER_NAME}' is running with image '${IMAGE_NAME}:${IMAGE_TAG}'."
