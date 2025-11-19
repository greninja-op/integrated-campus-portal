# ICP - Integrated Campus Portal (Development)

> 🚧 **Active Development** - This project is currently under development (60% complete)

## Quick Start

```bash
# Windows
dev-start.bat

# Linux/Mac
./dev-start.sh
```

## Access

- **Frontend**: http://localhost:5173 (Hot Reload)
- **Backend**: http://localhost:8080
- **Database**: localhost:3306

## Development Setup

This is a development environment with:
- ✅ Hot reload for instant feedback
- ✅ Live code changes without rebuilds
- ✅ Debug mode enabled
- ✅ Fast iteration cycle

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: PHP 8.2-FPM + Nginx
- **Database**: MySQL 8.0
- **Containerization**: Docker

## Project Status

- [x] Database schema
- [x] Authentication system
- [x] Student portal (partial)
- [x] Teacher portal (partial)
- [x] Admin portal (partial)
- [ ] Complete feature implementation
- [ ] Testing
- [ ] Production deployment

## Development Workflow

1. Edit files in `frontend/src/` or `backend/`
2. Changes apply automatically
3. View logs: `docker-compose logs -f`

## Documentation

- **README_DOCKER.md** - Docker setup guide
- **DEV_SETUP_COMPLETE.md** - Development environment details
- **DOCKER_DEV_README.md** - Development reference

## Production Files

All production-ready files, documentation, and deployment configs are in the `production/` folder.
These will be used when the project is 100% complete and ready for public release.

## Contributing

This project is not accepting contributions until development is complete.

## License

See `production/LICENSE` for details.
