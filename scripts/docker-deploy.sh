#!/bin/bash

# Docker Deployment Script for ICP
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Check environment file
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found"
        if [ -f .env.production ]; then
            print_info "Copying .env.production to .env"
            cp .env.production .env
            print_warning "Please update .env with your secure credentials"
            exit 1
        else
            print_error "No environment file found"
            exit 1
        fi
    fi
    print_success "Environment file exists"
}

# Build images
build_images() {
    print_info "Building Docker images..."
    docker-compose build --no-cache
    print_success "Images built successfully"
}

# Start containers
start_containers() {
    print_info "Starting containers..."
    docker-compose up -d
    print_success "Containers started"
}

# Wait for services
wait_for_services() {
    print_info "Waiting for services to be healthy..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "healthy"; then
            print_success "Services are healthy"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_warning "Services may not be fully healthy yet"
}

# Show status
show_status() {
    print_info "Container Status:"
    docker-compose ps
    
    echo ""
    print_info "Access URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost/api"
    echo "  Direct Backend: http://localhost:8080"
}

# Main deployment
main() {
    echo "========================================="
    echo "  ICP Docker Deployment"
    echo "========================================="
    echo ""
    
    check_prerequisites
    check_env
    build_images
    start_containers
    wait_for_services
    show_status
    
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    print_info "To view logs: docker-compose logs -f"
    print_info "To stop: docker-compose down"
}

# Run main function
main
