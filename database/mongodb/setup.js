/**
 * ICP MongoDB - one-shot setup
 * Creates the schema (collections + validators + indexes) and loads all seeds.
 *
 * Run from THIS directory (database/mongodb) so the relative paths resolve:
 *   mongosh "mongodb://localhost:27017/studentportal" --file setup.js
 *
 * load() resolves paths relative to the current working directory of mongosh.
 */

print('=== ICP MongoDB setup starting ===');

load('schema.js');
load('seeds/01_sessions.js');
load('seeds/02_admin.js');
load('seeds/03_populate_users.js');
load('seeds/04_subjects.js');

print('=== ICP MongoDB setup complete ===');
