/**
 * Inisialisasi Database SQLite & Skema Relasional
 * Sesuai Dokumen PRD Bagian 3
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'survey.db');

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'ADMIN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      target_sample INTEGER NOT NULL DEFAULT 400,
      province TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enumerators (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone_number TEXT,
      assigned_school TEXT,
      pin_hash TEXT NOT NULL,
      pin_raw TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      total_submissions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      enumerator_id TEXT REFERENCES enumerators(id) ON DELETE SET NULL,
      student_name TEXT,
      gender TEXT NOT NULL,
      religion TEXT NOT NULL,
      grade TEXT NOT NULL,
      school_name TEXT NOT NULL,
      social_media_duration TEXT NOT NULL,
      favorite_social_media TEXT NOT NULL,
      favorite_content TEXT NOT NULL,
      raw_responses TEXT NOT NULL,
      scored_responses TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_responses_project ON survey_responses(project_id);
    CREATE INDEX IF NOT EXISTS idx_responses_enumerator ON survey_responses(enumerator_id);
    CREATE INDEX IF NOT EXISTS idx_enumerators_pin ON enumerators(pin_raw);
    CREATE INDEX IF NOT EXISTS idx_enumerators_project ON enumerators(project_id);
  `);
}

/**
 * Hash utility menggunakan SHA-256 bawaan Node.js
 */
export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Helper generate ID unik
 */
export function generateId(prefix = '') {
  const rand = crypto.randomBytes(6).toString('hex');
  return prefix ? `${prefix}-${rand}` : rand;
}

/**
 * Helper generate PIN 6-digit acak
 */
export function generateRandomPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
