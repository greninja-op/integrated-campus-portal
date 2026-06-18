/**
 * Seed: Super Admin account
 * Converted from database/seeds/02_admin.sql
 *
 * Login -> username: admin   password: admin123
 * IMPORTANT: change this password in production.
 *
 * The bcrypt hash is carried over verbatim from the original SQL seed so the
 * existing PHP password_verify() logic keeps working.
 */

db = db.getSiblingDB('studentportal');

const now = new Date();

// Create the user document (mirrors INSERT INTO users ...)
db.users.updateOne(
  { username: 'admin' },
  {
    $set: {
      username: 'admin',
      password: '$2y$10$du.0smOc08Tu6Bld/2V3A.6iytE/Jcg4KqWt3fk9GHy7gjbSAu5LK',
      email: 'admin@studentportal.edu',
      role: 'admin',
      status: 'active',
      updated_at: now
    },
    $setOnInsert: { created_at: now }
  },
  { upsert: true }
);

// Resolve the user _id (replaces MySQL LAST_INSERT_ID())
const adminUser = db.users.findOne({ username: 'admin' });

// Create the admin profile (mirrors INSERT INTO admins ...)
db.admins.updateOne(
  { admin_id: 'ADM2024001' },
  {
    $set: {
      user_id: adminUser._id,
      admin_id: 'ADM2024001',
      first_name: 'System',
      last_name: 'Administrator',
      phone: '1234567890',
      designation: 'Super Admin',
      updated_at: now
    },
    $setOnInsert: { created_at: now }
  },
  { upsert: true }
);

print('Seeded super admin (username: admin).');
