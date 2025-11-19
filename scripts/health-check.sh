#!/bin/bash

# Health check script for ICP Docker deployment

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "ICP Health Check"
echo "================"
echo ""

# Check if containers are running
echo "Container Status:"
docker-compose ps

echo ""
echo "Health Checks:"

# Check database
if docker-compose exec -T db mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD:-rootpassword} &> /dev/null; then
    echo -e "${GREEN}✓ Database is healthy${NC}"
else
    echo -e "${RED}✗ Database is not responding${NC}"
fi

# Check backend
if curl -f http://localhost:8080 &> /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
fi

# Check frontend
if curl -f http://localhost &> /dev/null; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
fi

echo ""
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "Disk Usage:"
docker system df
