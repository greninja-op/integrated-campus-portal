# ICP - Integrated Campus Portal (Development)

> 🚧 **Active Development** - This project is currently under development (60% complete)

## Quick Start

```bash
# 1. Start MongoDB (local install or a managed instance), then load the schema + seeds:
cd database/mongodb
mongosh "mongodb://localhost:27017/studentportal" --file setup.js

# 2. Start the PHP backend (XAMPP PHP shown; adjust path as needed):
cd backend
php -S localhost:8000

# 3. Start the frontend dev server:
cd frontend
npm install
npm run dev
```

## Access

- **Frontend**: http://localhost:5173 (Hot Reload)
- **Backend**: http://localhost:8000
- **Database**: MongoDB at mongodb://localhost:27017 (database `studentportal`)

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: PHP 8.2
- **Database**: MongoDB

## Database

The database now targets **MongoDB**. The schema, validators, indexes, and seed
data live in `database/mongodb/` (converted from the original MySQL SQL files).
See `database/mongodb/README.md` for details and the conversion mapping.

> Note: the original MySQL `.sql` files are still present under `database/` for
> reference. The PHP backend's data layer (`backend/config/database.php` and the
> API endpoints) still uses PDO/MySQL and needs to be migrated to MongoDB
> separately — see the note at the bottom of `database/mongodb/README.md`.

## Project Status

- [x] Database schema
- [x] Authentication system
- [x] Student portal (partial)
- [x] Teacher portal (partial)
- [x] Admin portal (partial)
- [ ] Complete feature implementation
- [ ] Backend migration to MongoDB
- [ ] Testing
- [ ] Production deployment

## Development Workflow

1. Edit files in `frontend/src/` or `backend/`
2. The frontend hot-reloads automatically; restart the PHP server for backend changes

## Production Files

All production-ready files and documentation are in the `production/` folder.

## Contributing

This project is not accepting contributions until development is complete.

## License

See `production/LICENSE` for details.
