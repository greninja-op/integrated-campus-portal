/**
 * Seed: Academic Sessions
 * Converted from database/seeds/01_sessions.sql
 *
 * Run AFTER schema.js:
 *   mongosh studentportal --file seeds/01_sessions.js
 */

db = db.getSiblingDB('studentportal');

const now = new Date();

const sessions = [
  {
    session_name: '2024-2025',
    start_year: 2024,
    end_year: 2025,
    start_date: new Date('2024-07-01'),
    end_date: new Date('2025-06-30'),
    is_active: true,
    created_at: now,
    updated_at: now
  },
  {
    session_name: '2023-2024',
    start_year: 2023,
    end_year: 2024,
    start_date: new Date('2023-07-01'),
    end_date: new Date('2024-06-30'),
    is_active: false,
    created_at: now,
    updated_at: now
  },
  {
    session_name: '2022-2023',
    start_year: 2022,
    end_year: 2023,
    start_date: new Date('2022-07-01'),
    end_date: new Date('2023-06-30'),
    is_active: false,
    created_at: now,
    updated_at: now
  }
];

// Upsert by session_name so re-running does not duplicate
sessions.forEach((s) => {
  db.sessions.updateOne({ session_name: s.session_name }, { $set: s }, { upsert: true });
});

print('Seeded ' + db.sessions.countDocuments() + ' sessions.');
