# ICP - Integrated Campus Portal (Development)

> 🚧 **Active Development**

A university management system: students, teachers, and admins manage attendance,
marks, fees, study materials, notices, and assignments across BCA / BBA / B.Com.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS (`frontend/`)
- **Backend**: Node.js + Express (`server/`)
- **Database**: MongoDB (Atlas)

> The project was migrated from PHP + MySQL to a Node/Express + MongoDB stack.
> The old PHP backend and MySQL files have been removed.

## Project layout

```
frontend/          React + Vite app (UI)
server/            Node/Express API backed by MongoDB
database/mongodb/  MongoDB schema + seed scripts (and Atlas loader)
```

## Prerequisites

- Node.js (v18+)
- A MongoDB connection string (Atlas or local). Put it in `server/.env`
  (see `server/.env.example`).

## 1. Set up the database (one time)

```bash
cd database/mongodb
npm install
npm run setup        # creates collections, indexes, and seed data
```

`npm run setup` reads the connection string from `server/.env`.

## 2. Start the backend (port 8080)

```bash
cd server
npm install
npm start            # http://localhost:8080
```

## 3. Start the frontend (port 5173)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Open **http://localhost:5173** and log in.

## Default credentials

- **Admin**: `admin` / `admin123`
- **Teachers**: `teacher{1-5}.{bca|bba|bcom}@college.com` / `password123`
- **Students**: `student{1-5}.{bca|bba|bcom}@college.com` / `password123`

## Notes

- `server/.env` and `*/node_modules` are gitignored.
- The backend currently implements auth + the core read/admin endpoints needed to
  run the app. Endpoints not yet ported return an empty success response so the
  UI stays functional. See `server/index.mjs`.

## License

See `LICENSE`.
