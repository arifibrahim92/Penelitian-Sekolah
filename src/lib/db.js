/**
 * Inisialisasi Database SQLite & Skema Relasional
 * Mendukung Native better-sqlite3 dan Serverless In-Memory Fallback (Netlify/Vercel/AWS Lambda)
 */

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
const require = createRequire(import.meta.url);
const initialSeedData = require('./seedData.json');

let dbInstance = null;

/**
 * Mendeteksi direktori penyimpanan database yang aman (writeable).
 * Di serverless (Netlify/Lambda), process.cwd() bersifat read-only sehingga digunakan os.tmpdir().
 */
function resolveDatabasePath() {
  const localDataDir = path.join(process.cwd(), 'data');
  const localDbPath = path.join(localDataDir, 'survey.db');

  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    fs.accessSync(localDataDir, fs.constants.W_OK);
    return localDbPath;
  } catch {
    // Lingkungan serverless read-only (Netlify / Lambda / Vercel)
    const tmpDbPath = path.join(os.tmpdir(), 'survey.db');

    // Jika database lokal ada, salin ke /tmp untuk akses baca-tulis
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
      try {
        fs.copyFileSync(localDbPath, tmpDbPath);
      } catch (e) {
        console.warn('Could not copy bundled DB to /tmp:', e.message);
      }
    }
    return tmpDbPath;
  }
}

/**
 * Fallback Database Engine (Pure JS) untuk lingkungan yang gagal memuat binary native C++ better-sqlite3
 */
function createFallbackDatabase() {
  console.warn('⚡ Using Serverless Resilient Fallback Database Engine');

  let store = {
    admin_users: JSON.parse(JSON.stringify(initialSeedData.admin_users || [])),
    projects: JSON.parse(JSON.stringify(initialSeedData.projects || [])),
    enumerators: JSON.parse(JSON.stringify(initialSeedData.enumerators || [])),
    survey_responses: JSON.parse(JSON.stringify(initialSeedData.survey_responses || []))
  };

  const persistFile = path.join(os.tmpdir(), 'survey-fallback-store.json');
  if (fs.existsSync(persistFile)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(persistFile, 'utf8'));
      if (loaded && loaded.admin_users) {
        store = loaded;
      }
    } catch {}
  }

  function save() {
    try {
      fs.writeFileSync(persistFile, JSON.stringify(store));
    } catch {}
  }

  return {
    isFallback: true,
    pragma() {},
    exec() {},
    transaction(fn) {
      return (...args) => {
        const res = fn(...args);
        save();
        return res;
      };
    },
    prepare(sql) {
      const cleanSql = sql.trim().replace(/\s+/g, ' ');

      return {
        get(...params) {
          const allResults = this.all(...params);
          return allResults.length > 0 ? allResults[0] : undefined;
        },

        all(...params) {
          const s = cleanSql.toUpperCase();

          // 1. SELECT * FROM projects WHERE id = ?
          if (s.includes('FROM PROJECTS') && s.includes('WHERE ID = ?')) {
            const id = params[0];
            return store.projects.filter(p => p.id === id);
          }

          // 2. SELECT * FROM projects
          if (s.startsWith('SELECT * FROM PROJECTS') && !s.includes('WHERE')) {
            return [...store.projects];
          }

          // 3. SELECT COUNT(*) as count FROM survey_responses WHERE project_id = ?
          if (s.includes('FROM SURVEY_RESPONSES') && s.includes('COUNT(*)') && s.includes('WHERE PROJECT_ID = ?')) {
            const pid = params[0];
            const count = store.survey_responses.filter(r => r.project_id === pid).length;
            return [{ count }];
          }

          // 4. SELECT COUNT(DISTINCT school_name) as count FROM survey_responses WHERE project_id = ?
          if (s.includes('DISTINCT SCHOOL_NAME') && s.includes('WHERE PROJECT_ID = ?')) {
            const pid = params[0];
            const schools = new Set(
              store.survey_responses.filter(r => r.project_id === pid).map(r => r.school_name).filter(Boolean)
            );
            return [{ count: schools.size }];
          }

          // 5. SELECT COUNT(*) as count FROM enumerators WHERE project_id = ? AND status = 'ACTIVE'
          if (s.includes('FROM ENUMERATORS') && s.includes('COUNT(*)') && s.includes('ACTIVE')) {
            const pid = params[0];
            const count = store.enumerators.filter(e => e.project_id === pid && e.status === 'ACTIVE').length;
            return [{ count }];
          }

          // 6. SELECT ... FROM admin_users WHERE email = ?
          if (s.includes('FROM ADMIN_USERS') && s.includes('WHERE EMAIL = ?')) {
            const email = (params[0] || '').toLowerCase();
            return store.admin_users.filter(u => (u.email || '').toLowerCase() === email);
          }

          // 7. SELECT admin_users WHERE id = ?
          if (s.includes('FROM ADMIN_USERS') && s.includes('WHERE ID = ?')) {
            const id = params[0];
            return store.admin_users.filter(u => u.id === id);
          }

          // 8. Enumerator PIN verify JOIN query
          if (s.includes('FROM ENUMERATORS E') && s.includes('JOIN PROJECTS P') && s.includes('PIN_RAW = ?')) {
            const pin = (params[0] || '').trim();
            const enumerator = store.enumerators.find(e => e.pin_raw === pin);
            if (!enumerator) return [];
            const project = store.projects.find(p => p.id === enumerator.project_id) || {};
            return [{
              id: enumerator.id,
              project_id: enumerator.project_id,
              full_name: enumerator.full_name,
              phone_number: enumerator.phone_number,
              assigned_school: enumerator.assigned_school,
              status: enumerator.status,
              total_submissions: enumerator.total_submissions || 0,
              project_name: project.project_name || '',
              province: project.province || '',
              project_status: project.status || 'ACTIVE'
            }];
          }

          // 9. Today submissions count
          if (s.includes('FROM SURVEY_RESPONSES') && s.includes('ENUMERATOR_ID = ?') && s.includes('DATE(CREATED_AT)')) {
            const eid = params[0];
            const today = new Date().toISOString().slice(0, 10);
            const count = store.survey_responses.filter(r => r.enumerator_id === eid && (r.created_at || '').startsWith(today)).length;
            return [{ count }];
          }

          // 10. SELECT * FROM enumerators WHERE project_id = ?
          if (s.includes('FROM ENUMERATORS') && s.includes('WHERE PROJECT_ID = ?')) {
            const pid = params[0];
            return store.enumerators.filter(e => e.project_id === pid);
          }

          // 11. SELECT * FROM enumerators WHERE id = ?
          if (s.includes('FROM ENUMERATORS') && s.includes('WHERE ID = ?')) {
            const id = params[0];
            return store.enumerators.filter(e => e.id === id);
          }

          // 12. SELECT * FROM enumerators
          if (s.startsWith('SELECT * FROM ENUMERATORS')) {
            return [...store.enumerators];
          }

          // 13. SELECT * FROM survey_responses WHERE project_id = ?
          if (s.includes('FROM SURVEY_RESPONSES') && s.includes('WHERE PROJECT_ID = ?')) {
            const pid = params[0];
            let list = store.survey_responses.filter(r => r.project_id === pid);
            list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            // Check for LIMIT & OFFSET
            if (params.length >= 3 && typeof params[1] === 'number') {
              const limit = params[1];
              const offset = params[2] || 0;
              return list.slice(offset, offset + limit);
            }
            return list;
          }

          // 14. SELECT * FROM survey_responses WHERE id = ?
          if (s.includes('FROM SURVEY_RESPONSES') && s.includes('WHERE ID = ?')) {
            const id = params[0];
            return store.survey_responses.filter(r => r.id === id);
          }

          // 15. SELECT * FROM survey_responses
          if (s.startsWith('SELECT * FROM SURVEY_RESPONSES')) {
            return [...store.survey_responses];
          }

          return [];
        },

        run(...params) {
          const s = cleanSql.toUpperCase();

          // 1. INSERT INTO survey_responses
          if (s.startsWith('INSERT INTO SURVEY_RESPONSES')) {
            const [
              id, project_id, enumerator_id, student_name, gender, religion, grade,
              school_name, social_media_duration, favorite_social_media, favorite_content,
              raw_responses, scored_responses, created_at
            ] = params;

            store.survey_responses.push({
              id, project_id, enumerator_id, student_name, gender, religion, grade,
              school_name, social_media_duration, favorite_social_media, favorite_content,
              raw_responses, scored_responses, created_at: created_at || new Date().toISOString()
            });
            save();
            return { changes: 1, lastInsertRowid: store.survey_responses.length };
          }

          // 2. UPDATE enumerators SET total_submissions = total_submissions + ? WHERE id = ?
          if (s.startsWith('UPDATE ENUMERATORS') && s.includes('TOTAL_SUBMISSIONS = TOTAL_SUBMISSIONS + ?')) {
            const [increment, id] = params;
            const item = store.enumerators.find(e => e.id === id);
            if (item) {
              item.total_submissions = (item.total_submissions || 0) + Number(increment);
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          // 3. UPDATE enumerators SET total_submissions = total_submissions + 1 WHERE id = ?
          if (s.startsWith('UPDATE ENUMERATORS') && s.includes('TOTAL_SUBMISSIONS = TOTAL_SUBMISSIONS + 1')) {
            const id = params[0];
            const item = store.enumerators.find(e => e.id === id);
            if (item) {
              item.total_submissions = (item.total_submissions || 0) + 1;
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          // 4. UPDATE enumerators (status, pin, school, etc.)
          if (s.startsWith('UPDATE ENUMERATORS')) {
            const id = params[params.length - 1];
            const item = store.enumerators.find(e => e.id === id);
            if (item) {
              if (s.includes('STATUS = ?')) item.status = params[0];
              if (s.includes('PIN_RAW = ?')) {
                item.pin_raw = params[0];
                item.pin_hash = hashString(params[0]);
              }
              if (s.includes('ASSIGNED_SCHOOL = ?')) item.assigned_school = params[0];
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          // 5. INSERT INTO enumerators
          if (s.startsWith('INSERT INTO ENUMERATORS')) {
            const [id, project_id, full_name, phone_number, assigned_school, pin_hash, pin_raw] = params;
            store.enumerators.push({
              id, project_id, full_name, phone_number, assigned_school,
              pin_hash, pin_raw, status: 'ACTIVE', total_submissions: 0,
              created_at: new Date().toISOString()
            });
            save();
            return { changes: 1 };
          }

          // 6. DELETE FROM enumerators WHERE id = ?
          if (s.startsWith('DELETE FROM ENUMERATORS') && s.includes('WHERE ID = ?')) {
            const id = params[0];
            const prevLen = store.enumerators.length;
            store.enumerators = store.enumerators.filter(e => e.id !== id);
            save();
            return { changes: prevLen - store.enumerators.length };
          }

          // 7. DELETE FROM survey_responses WHERE id = ?
          if (s.startsWith('DELETE FROM SURVEY_RESPONSES') && s.includes('WHERE ID = ?')) {
            const id = params[0];
            const prevLen = store.survey_responses.length;
            store.survey_responses = store.survey_responses.filter(r => r.id !== id);
            save();
            return { changes: prevLen - store.survey_responses.length };
          }

          // 8. INSERT INTO projects
          if (s.startsWith('INSERT INTO PROJECTS')) {
            const [id, project_name, target_sample, province, status, created_by] = params;
            store.projects.push({
              id, project_name, target_sample: Number(target_sample) || 400,
              province, status: status || 'ACTIVE', created_by,
              created_at: new Date().toISOString()
            });
            save();
            return { changes: 1 };
          }

          // 9. UPDATE projects
          if (s.startsWith('UPDATE PROJECTS')) {
            const id = params[params.length - 1];
            const item = store.projects.find(p => p.id === id);
            if (item) {
              if (s.includes('STATUS = ?')) item.status = params[0];
              save();
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          return { changes: 0 };
        }
      };
    }
  };
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const Database = require('better-sqlite3');
    const dbPath = resolveDatabasePath();
    const db = new Database(dbPath);

    try {
      db.pragma('journal_mode = WAL');
    } catch {
      try { db.pragma('journal_mode = DELETE'); } catch {}
    }

    try {
      db.pragma('foreign_keys = ON');
    } catch {}

    initTables(db);
    seedIfEmpty(db);

    dbInstance = db;
    return dbInstance;
  } catch (err) {
    console.warn('better-sqlite3 initialization failed, switching to resilient fallback engine:', err.message);
    dbInstance = createFallbackDatabase();
    return dbInstance;
  }
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

    CREATE TABLE IF NOT EXISTS projects_idx (id TEXT);
  `);
}

function seedIfEmpty(db) {
  try {
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get()?.count || 0;
    if (adminCount === 0 && initialSeedData) {
      const insertAdmin = db.prepare(`
        INSERT OR IGNORE INTO admin_users (id, email, password_hash, name, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const u of (initialSeedData.admin_users || [])) {
        insertAdmin.run(u.id, u.email, u.password_hash, u.name, u.role, u.created_at);
      }

      const insertProj = db.prepare(`
        INSERT OR IGNORE INTO projects (id, project_name, target_sample, province, status, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of (initialSeedData.projects || [])) {
        insertProj.run(p.id, p.project_name, p.target_sample, p.province, p.status, p.created_by, p.created_at);
      }

      const insertEnum = db.prepare(`
        INSERT OR IGNORE INTO enumerators (id, project_id, full_name, phone_number, assigned_school, pin_hash, pin_raw, status, total_submissions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of (initialSeedData.enumerators || [])) {
        insertEnum.run(e.id, e.project_id, e.full_name, e.phone_number, e.assigned_school, e.pin_hash, e.pin_raw, e.status, e.total_submissions, e.created_at);
      }

      const insertResp = db.prepare(`
        INSERT OR IGNORE INTO survey_responses (
          id, project_id, enumerator_id, student_name, gender, religion, grade,
          school_name, social_media_duration, favorite_social_media, favorite_content,
          raw_responses, scored_responses, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of (initialSeedData.survey_responses || [])) {
        insertResp.run(
          r.id, r.project_id, r.enumerator_id, r.student_name, r.gender, r.religion, r.grade,
          r.school_name, r.social_media_duration, r.favorite_social_media, r.favorite_content,
          r.raw_responses, r.scored_responses, r.created_at
        );
      }
    }
  } catch (err) {
    console.warn('Auto-seed check error:', err.message);
  }
}

export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function generateId(prefix = '') {
  const rand = crypto.randomBytes(6).toString('hex');
  return prefix ? `${prefix}-${rand}` : rand;
}

export function generateRandomPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
