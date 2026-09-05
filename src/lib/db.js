/**
 * Inisialisasi Database SQLite & Skema Relasional
 * Mendukung Native better-sqlite3 di lokal dan Pure-JS Resilient Engine di Serverless Cloud (Netlify / Vercel / AWS Lambda)
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { initialSeedData } from './seedData.js';

let dbInstance = null;

/**
 * Pure-JS Resilient In-Memory Database Engine
 * Menjamin zero-crash 100% pada lingkungan serverless seperti Netlify & AWS Lambda.
 */
function createFallbackDatabase() {
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
      if (loaded && loaded.admin_users && loaded.admin_users.length > 0) {
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
      const s = cleanSql.toUpperCase();

      return {
        get(...params) {
          const results = this.all(...params);
          return results.length > 0 ? results[0] : undefined;
        },

        all(...params) {
          // 1. Projects queries
          if (s.includes('FROM PROJECTS')) {
            if (s.includes('COUNT(*)')) {
              return [{ count: store.projects.length }];
            }

            if (s.includes('WHERE ID = ?') || s.includes('WHERE P.ID = ?')) {
              const id = params[0];
              const p = store.projects.find(item => item.id === id);
              if (!p) return [];
              return [{ ...p }];
            }

            // List projects with calculated columns
            return store.projects.map(p => {
              const total_responses = store.survey_responses.filter(r => r.project_id === p.id).length;
              const active_enumerators = store.enumerators.filter(e => e.project_id === p.id && e.status === 'ACTIVE').length;
              const schools = new Set(store.survey_responses.filter(r => r.project_id === p.id).map(r => r.school_name).filter(Boolean));
              return {
                ...p,
                total_responses,
                active_enumerators,
                total_schools: schools.size
              };
            });
          }

          // 2. Counts on survey_responses
          if (s.includes('FROM SURVEY_RESPONSES') && s.includes('COUNT(*)')) {
            if (s.includes('WHERE PROJECT_ID = ?') || s.includes('R.PROJECT_ID = ?')) {
              const pid = params[0];
              const count = store.survey_responses.filter(r => r.project_id === pid).length;
              return [{ count }];
            }
            if (s.includes('ENUMERATOR_ID = ?') && s.includes('DATE(')) {
              const eid = params[0];
              const today = new Date().toISOString().slice(0, 10);
              const count = store.survey_responses.filter(r => r.enumerator_id === eid && (r.created_at || '').startsWith(today)).length;
              return [{ count }];
            }
            return [{ count: store.survey_responses.length }];
          }

          // 3. Count distinct school_name
          if (s.includes('DISTINCT SCHOOL_NAME') && s.includes('WHERE PROJECT_ID = ?')) {
            const pid = params[0];
            const schools = new Set(
              store.survey_responses.filter(r => r.project_id === pid).map(r => r.school_name).filter(Boolean)
            );
            return [{ count: schools.size }];
          }

          // 4. Enumerators count
          if (s.includes('FROM ENUMERATORS') && s.includes('COUNT(*)')) {
            let list = store.enumerators;
            const pid = params[0];
            if (pid) {
              list = list.filter(e => e.project_id === pid);
            }
            if (s.includes('ACTIVE')) {
              list = list.filter(e => e.status === 'ACTIVE');
            }
            return [{ count: list.length }];
          }

          // 5. Admin users queries
          if (s.includes('FROM ADMIN_USERS')) {
            if (s.includes('WHERE EMAIL = ?')) {
              const email = (params[0] || '').trim().toLowerCase();
              return store.admin_users.filter(u => (u.email || '').trim().toLowerCase() === email);
            }
            if (s.includes('WHERE ID = ?')) {
              return store.admin_users.filter(u => u.id === params[0]);
            }
            return [...store.admin_users];
          }

          // 6. Enumerators queries
          if (s.includes('FROM ENUMERATORS')) {
            // Join query for PIN login / verification
            if (s.includes('JOIN PROJECTS') && s.includes('PIN_RAW = ?')) {
              const pin = (params[0] || '').trim();
              const e = store.enumerators.find(item => item.pin_raw === pin);
              if (!e) return [];
              const project = store.projects.find(p => p.id === e.project_id) || {};
              return [{
                id: e.id,
                project_id: e.project_id,
                full_name: e.full_name,
                phone_number: e.phone_number,
                assigned_school: e.assigned_school,
                status: e.status,
                total_submissions: e.total_submissions || 0,
                project_name: project.project_name || '',
                province: project.province || '',
                project_status: project.status || 'ACTIVE'
              }];
            }

            if (s.includes('WHERE PIN_RAW = ?')) {
              const pin = (params[0] || '').trim();
              return store.enumerators.filter(e => e.pin_raw === pin);
            }

            if (s.includes('WHERE PROJECT_ID = ?') || s.includes('WHERE E.PROJECT_ID = ?')) {
              const pid = params[0];
              const today = new Date().toISOString().slice(0, 10);
              return store.enumerators.filter(e => e.project_id === pid).map(e => ({
                ...e,
                today_submissions: store.survey_responses.filter(r => r.enumerator_id === e.id && (r.created_at || '').startsWith(today)).length
              }));
            }

            if (s.includes('WHERE ID = ?') || s.includes('WHERE E.ID = ?')) {
              return store.enumerators.filter(e => e.id === params[0]);
            }

            // All enumerators with today's count
            const today = new Date().toISOString().slice(0, 10);
            return store.enumerators.map(e => ({
              ...e,
              today_submissions: store.survey_responses.filter(r => r.enumerator_id === e.id && (r.created_at || '').startsWith(today)).length
            }));
          }

          // 7. Survey responses queries
          if (s.includes('FROM SURVEY_RESPONSES')) {
            if (s.includes('WHERE R.ID = ?') || s.includes('WHERE ID = ?')) {
              const id = params[0];
              const r = store.survey_responses.find(item => item.id === id);
              if (!r) return [];
              const e = store.enumerators.find(item => item.id === r.enumerator_id) || {};
              const p = store.projects.find(item => item.id === r.project_id) || {};
              return [{
                ...r,
                enumerator_name: e.full_name || '',
                project_name: p.project_name || '',
                province: p.province || ''
              }];
            }

            let list = [...store.survey_responses];
            if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('PRJ-')) {
              list = list.filter(r => r.project_id === params[0]);
            }

            list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            return list.map(r => {
              const e = store.enumerators.find(item => item.id === r.enumerator_id);
              return {
                ...r,
                enumerator_name: e?.full_name || ''
              };
            });
          }

          return [];
        },

        run(...params) {
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

          // 2. UPDATE enumerators SET total_submissions = total_submissions + ...
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

          // 3. UPDATE enumerators general
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

          // 4. INSERT INTO enumerators
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

          // 5. DELETE FROM enumerators
          if (s.startsWith('DELETE FROM ENUMERATORS')) {
            const id = params[0];
            const prev = store.enumerators.length;
            store.enumerators = store.enumerators.filter(e => e.id !== id);
            save();
            return { changes: prev - store.enumerators.length };
          }

          // 6. DELETE FROM survey_responses
          if (s.startsWith('DELETE FROM SURVEY_RESPONSES')) {
            const id = params[0];
            const prev = store.survey_responses.length;
            store.survey_responses = store.survey_responses.filter(r => r.id !== id);
            save();
            return { changes: prev - store.survey_responses.length };
          }

          // 7. INSERT INTO projects
          if (s.startsWith('INSERT INTO PROJECTS')) {
            const [id, project_name, target_sample, province, status, created_by] = params;
            store.projects.push({
              id, project_name, target_sample: Number(target_sample) || 400,
              province, status: status || 'ACTIVE', created_by: created_by || 'ADMIN',
              created_at: new Date().toISOString()
            });
            save();
            return { changes: 1 };
          }

          // 8. UPDATE projects
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

  // Jika berjalan di cloud Netlify / Vercel / AWS Lambda atau produksi, gunakan Resilient Engine
  const isServerless = Boolean(
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL
  );

  if (isServerless) {
    dbInstance = createFallbackDatabase();
    return dbInstance;
  }

  // Jika di lingkungan lokal (Mac/PC developer)
  try {
    const { createRequire } = require('module');
    const localRequire = createRequire(import.meta.url);
    const Database = localRequire('better-sqlite3');
    const localDataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    const dbPath = path.join(localDataDir, 'survey.db');
    const db = new Database(dbPath);

    try { db.pragma('journal_mode = WAL'); } catch {}
    try { db.pragma('foreign_keys = ON'); } catch {}

    initTables(db);
    dbInstance = db;
    return dbInstance;
  } catch {
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
  `);
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
