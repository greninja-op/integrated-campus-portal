# ICP - Integrated Campus Portal

> A comprehensive university management system with modern React frontend and robust PHP backend.

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php)](https://php.net)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)](https://reactjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?logo=mysql)](https://mysql.com)

## Overview

ICP (Integrated Campus Portal) is an enterprise-grade university management system designed to streamline academic operations, student services, and administrative tasks.

## Features

### Student Portal
- Academic management (courses, results, GPA tracking)
- Attendance tracking
- Fee management and payment
- Document downloads (ID cards, receipts)

### Teacher Portal
- Student management
- Attendance marking
- Marks entry and grading
- Performance analytics

### Admin Portal
- User management
- Academic administration
- Fee structure configuration
- System-wide announcements
- Reports and analytics

## Technology Stack

- **Frontend**: React 19.0.0 + Vite + Tailwind CSS
- **Backend**: PHP 8.2-FPM + Nginx
- **Database**: MySQL 8.0
- **Containerization**: Docker

## Quick Start

### Using Docker (Recommended)

```bash
cd docker
docker-compose up -d --build
```

Access:
- Frontend: http://localhost
- Backend API: http://localhost/api

### Manual Setup

See `docs/INSTALLATION.md` for detailed instructions.

## Documentation

- **docs/INSTALLATION.md** - Installation guide
- **docs/deployment/** - Deployment guides
- **docs/api/** - API documentation
- **docs/guides/** - User guides
- **ARCHITECTURE.md** - System architecture
- **DOCKER_DEPLOYMENT.md** - Docker deployment guide

## Docker Deployment

Complete Docker setup with:
- Multi-stage optimized builds
- SSL/TLS support
- Monitoring stack (Prometheus + Grafana)
- Automated backups
- Health checks
- Horizontal scaling support

See `docker/` folder and `DOCKER_DEPLOYMENT.md` for details.

## Contributing

See `CONTRIBUTING.md` for contribution guidelines.

## Changelog

See `CHANGELOG.md` for version history.

## License

See `LICENSE` for details.

## Support

For issues and questions, please check the documentation in the `docs/` folder.
