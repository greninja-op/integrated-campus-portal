/**
 * Quick connectivity + data check for the ICP MongoDB (Atlas).
 * Reads the connection string from server/.env and prints each collection's
 * document count.
 *
 * Run:  cd database/mongodb && node verify.mjs
 */
import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  for (const p of [resolve(__dirname, '.env'), resolve(__dirname, '../../server/.env'), resolve(__dirname, '../../backend/.env')]) {
    let raw;
    try { raw = readFileSync(p, 'utf8'); } catch { continue; }
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('='); if (i === -1) continue;
      const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(k in env)) env[k] = v;
    }
    break;
  }
  return env;
}

const env = loadEnv();
const URI = env.MONGODB_URI;
const DB_NAME = env.MONGODB_DB || 'studentportal';
if (!URI) { console.error('No MONGODB_URI found in server/.env'); process.exit(1); }

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  await client.db(DB_NAME).command({ ping: 1 });
  console.log('CONNECTED to Atlas. Database: ' + DB_NAME + '\n');
  const db = client.db(DB_NAME);
  const cols = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).sort();
  let total = 0;
  for (const name of cols) {
    const n = await db.collection(name).countDocuments();
    total += n;
    console.log('  ' + name.padEnd(24) + n);
  }
  console.log('\n' + cols.length + ' collections, ' + total + ' documents total.');
} catch (err) {
  console.error('NOT CONNECTED:', err.message);
  process.exit(1);
} finally {
  await client.close();
}
