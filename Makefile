.PHONY: help build up down restart logs clean prod-build prod-up prod-down dev-build dev-up dev-down

help:
	@echo "ICP Docker Management Commands"
	@echo "=============================="
	@echo "Development (Fast, Hot Reload):"
	@echo "  make dev           - Start development environment"
	@echo "  make dev-build     - Rebuild development images"
	@echo "  make dev-down      - Stop development"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build    - Build production images"
	@echo "  make prod-up       - Start production containers"
	@echo "  make prod-down     - Stop production containers"
	@echo ""
	@echo "General:"
	@echo "  make logs          - View container logs"
	@echo "  make restart       - Restart all containers"
	@echo "  make clean         - Remove all containers, volumes, and images"

# Development commands (default)
dev:
	docker-compose up -d

dev-build:
	docker-compose up -d --build

dev-down:
	docker-compose down

# Production commands
prod-build:
	cd docker-production && docker-compose build

prod-up:
	cd docker-production && docker-compose up -d

prod-down:
	cd docker-production && docker-compose down

# General commands
logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v --rmi all
	docker system prune -af
