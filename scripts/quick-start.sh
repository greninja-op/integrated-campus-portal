#!/bin/bash

# Quick Start Script for ICP Docker Deployment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "  ICP Quick Start"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    if [ -f .env.production ]; then
        cp .env.production .env
        echo ""
        echo -e "${RED}[IMPORTANT] Please edit .env file with your credentials${NC}"
        echo "Press Enter after updating .env file..."
        read
    else
        echo -e "${RED}[ERROR] .env.production template not found${NC}"
        exit 1
    fi
fi

echo "Starting ICP in production mode..."
echo ""

# Start containers
docker-compose up -d --build

echo ""
echo "Waiting for services to start..."
sleep 15

echo ""
echo "========================================="
echo "  ICP is now running!"
echo "========================================="
echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost/api"
echo "  Direct Backend: http://localhost:8080"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop: docker-compose down"
echo "  Restart: docker-compose restart"
echo "  Status: docker-compose ps"
echo ""
echo "For monitoring (optional):"
echo "  docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d"
echo "  Grafana: http://localhost:3001 (admin/admin)"
echo "  Prometheus: http://localhost:9090"
echo ""
