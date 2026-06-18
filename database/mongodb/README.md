# ICP MongoDB Database

This folder contains the MongoDB version of the ICP database, converted from the
original MySQL SQL files in `database/` (`schema.sql`, `migrations/*.sql`,
`seeds/*.sql`).

## What changed in the conversion

| MySQL concept | MongoDB equivalent |
|---|---|
| Database `studentportal` | Database `studentportal` |
| Table | Collection |
| Row | Document |
| `INT AUTO_INCREMENT PRIMARY KEY id` | `_id` (`ObjectId`) |
| Foreign key `xxx_id INT` | `xxx_id` storing the referenced document's `ObjectId` |
| `ENUM(...)` | JSON-schema `enum` validator |
| `CHECK (semester BETWEEN 1 AND 6)` | JSON-schema `minimum`/`maximum` |
| `INDEX` / `UNIQUE KEY` | `createIndex(..., { unique: true })` |
| `CREATE TABLE` + incremental `ALTER TABLE` migrations | A single **final-state** `schema.js` (all migrations already applied) |
| Stored procedure / event (`progress_students_semester`) | Not portable to MongoDB — must be reimplemented in app code or a cron/scheduled job (see note below) |

Because MongoDB is schema-flexible, the incremental `ALTER TABLE` migration files
were collapsed into one consolidated schema that reflects the database's **final
state** (parent/guardian fields, blood group, exam types, assignments, enhanced
marks, notices category/priority, etc.).

## Files

- `schema.js` — creates all 18 collections with JSON-schema validators and indexes.
- `setup.js` — runs `schema.js` then all seeds in order (one command).
- `seeds/01_sessions.js` — academic sessions (from `01_sessions.sql`).
- `seeds/02_admin.js` — super admin (`admin` / `admin123`) (from `02_admin.sql`).
- `seeds/03_populate_users.js` — admin + 15 teachers + 15 students, all password `password123` (from `populate_users.sql`).
- `seeds/04_subjects.js` — full BCA / BBA / B.Com curriculum (from `11_all_subjects.sql`).

## How to run

Prerequisite: a running MongoDB instance and `mongosh` installed.

```bash
# from this directory (database/mongodb)
mongosh "mongodb://localhost:27017/studentportal" --file setup.js
```

Or run the pieces individually:

```bash
mongosh studentportal --file schema.js
mongosh studentportal --file seeds/01_sessions.js
mongosh studentportal --file seeds/02_admin.js
mongosh studentportal --file seeds/03_populate_users.js
mongosh studentportal --file seeds/04_subjects.js
```

> The seed scripts use `updateOne(..., { upsert: true })` keyed on natural keys
> (username, email, subject_code, etc.), so they are safe to re-run.

## Validators

Validators use `validationAction: "warn"` and `validationLevel: "moderate"` so
inserts that don't perfectly match the schema are logged but not rejected. Tighten
to `"error"` once the application layer is fully migrated.

## Default credentials

- Admin: `admin` / `admin123`
- Teachers: `teacher{1-5}.{bca|bba|bcom}@college.com` / `password123`
- Students: `student{1-5}.{bca|bba|bcom}@college.com` / `password123`

(Password hashes are bcrypt, carried over verbatim from the SQL seeds so PHP
`password_verify()` continues to work.)

## ⚠️ Important: application layer still targets MySQL

This conversion covers the **database definition and seed data only**. The PHP
backend (`backend/config/database.php` and every `*.php` API endpoint) still uses
PDO + MySQL prepared statements. To actually run the app on MongoDB you also need to:

1. Replace `backend/config/database.php` with a MongoDB connection (e.g. the
   `mongodb/mongodb` PHP library via Composer).
2. Rewrite each API endpoint's SQL queries as MongoDB queries/aggregations.
3. Reimplement the `progress_students_semester` stored procedure as a scheduled
   job or application-level routine.

The schema here is designed to make that backend migration straightforward
(collection + field names mirror the original tables/columns).
