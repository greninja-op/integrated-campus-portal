#!/bin/bash
# Script to create private repos and push ICP images to Docker Hub
# Usage: ./push-to-dockerhub.sh <username> <password>

if [ -z "$1" ]; then
    echo "Error: Docker Hub username required"
    echo "Usage: ./push-to-dockerhub.sh <username> <password>"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Error: Docker Hub password required"
    echo "Usage: ./push-to-dockerhub.sh <username> <password>"
    exit 1
fi

DOCKERHUB_USER=$1
DOCKERHUB_PASS=$2
VERSION="dev"

echo "========================================"
echo "Creating Private Repos and Pushing ICP Images"
echo "========================================"
echo "Username: $DOCKERHUB_USER"
echo "Version: $VERSION"
echo "========================================"

# Login to Docker Hub
echo ""
echo "Step 1: Logging in to Docker Hub..."
echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin

if [ $? -ne 0 ]; then
    echo "Failed to login to Docker Hub"
    exit 1
fi

# Get Docker Hub token for API calls
echo ""
echo "Step 2: Getting Docker Hub API token..."
TOKEN=$(curl -s -X POST https://hub.docker.com/v2/users/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$DOCKERHUB_USER\",\"password\":\"$DOCKERHUB_PASS\"}" | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Failed to get API token"
    exit 1
fi

echo "Token obtained successfully"

# Create private repositories
echo ""
echo "Step 3: Creating private repositories..."

curl -s -X POST https://hub.docker.com/v2/repositories/ \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"namespace\":\"$DOCKERHUB_USER\",\"name\":\"icp-backend\",\"description\":\"ICP Backend - PHP API\",\"is_private\":true}"

curl -s -X POST https://hub.docker.com/v2/repositories/ \
  -H "Authorization: JWT $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"namespace\":\"$DOCKERHUB_USER\",\"name\":\"icp-frontend\",\"description\":\"ICP Frontend - React SPA\",\"is_private\":true}"

echo "Repositories created (or already exist)"

# Tag images
echo ""
echo "Step 4: Tagging images..."
docker tag icp-backend:latest $DOCKERHUB_USER/icp-backend:$VERSION
docker tag icp-frontend:latest $DOCKERHUB_USER/icp-frontend:$VERSION

echo "Tagged: $DOCKERHUB_USER/icp-backend:$VERSION"
echo "Tagged: $DOCKERHUB_USER/icp-frontend:$VERSION"

# Push images
echo ""
echo "Step 5: Pushing backend image..."
docker push $DOCKERHUB_USER/icp-backend:$VERSION

if [ $? -ne 0 ]; then
    echo "Failed to push backend image"
    exit 1
fi

echo ""
echo "Step 6: Pushing frontend image..."
docker push $DOCKERHUB_USER/icp-frontend:$VERSION

if [ $? -ne 0 ]; then
    echo "Failed to push frontend image"
    exit 1
fi

echo ""
echo "========================================"
echo "SUCCESS! Private repos created and images pushed"
echo "========================================"
echo "Backend: $DOCKERHUB_USER/icp-backend:$VERSION"
echo "Frontend: $DOCKERHUB_USER/icp-frontend:$VERSION"
echo "========================================"
echo ""
echo "Verify at: https://hub.docker.com/repositories"
echo "========================================"
