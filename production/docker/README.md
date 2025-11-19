# Production Docker Configuration

This folder contains production-ready Docker configurations.

## Files

- `docker-compose.yml` - Main production setup
- `docker-compose.prod.yml` - Production with scaling
- `docker-compose.monitoring.yml` - Monitoring stack
- `Dockerfile.backend` - Optimized backend image
- `Dockerfile.frontend` - Optimized frontend image
- `.env.production` - Production environment template

## Deployment

```bash
# From this directory
docker-compose up -d --build

# Or from project root
docker-compose -f docker-production/docker-compose.yml up -d --build
```

## Features

- Multi-stage builds (smaller images)
- OPcache enabled
- SSL/TLS support
- Security hardened
- Resource limits
- Health checks
- Monitoring ready

## Documentation

See main project documentation:
- DOCKER_DEPLOYMENT.md
- PRODUCTION_CHECKLIST.md
- DOCKER_SETUP_SUMMARY.md
