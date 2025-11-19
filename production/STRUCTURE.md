# Production Structure

This folder contains all production-ready files for deployment.

## Contents

- **docker/** - Production Docker configurations
- **docs/** - Complete documentation
- **.github/** - CI/CD workflows
- **README.md** - Public project README
- **LICENSE** - License information
- **CONTRIBUTING.md** - How to contribute
- **CHANGELOG.md** - Version history
- **ARCHITECTURE.md** - System architecture
- **DOCKER_*.md** - Docker deployment guides

## Usage

When the project is ready for production deployment:

```bash
cd production/docker
docker-compose up -d --build
```

See individual documentation files for detailed instructions.
