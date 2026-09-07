/**
 * Database Seeder & Data Parser dari Jawa Barat - Input Hasil Survey Respon Siswa.xlsx
 */

import { getDb, hashString, generateId } from './db.js';
import { scoreAllResponses } from './scoringEngine.js';
import path from 'path';
import fs from 'fs';

export function runSeed() {
  const db = getDb();
  console.log('🚀 Memulai proses inisialisasi database dan seeding data...');

  // 1. Seed Admin Default
  const adminExists = db.prepare('SELECT id FROM admin_users WHERE email = ?').get('admin@survei-damai.id');
  let adminId = adminExists?.id;
  if (!adminExists) {
    adminId = generateId('ADM');
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      adminId,
      'admin@survei-damai.id',
      hashString('admin123456'),
      'Dr. Haris Fatwa, M.Si (Lead Peneliti)',
      'ADMIN'
    );
    console.log('✅ Admin default dibuat: admin@survei-damai.id / admin123456');
  } else {
    console.log('ℹ️ Admin default sudah ada.');
  }

  // 2. Seed Default Project
  const projectId = 'PRJ-2026-JB-001';
  const projectExists = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!projectExists) {
    db.prepare(`
      INSERT INTO projects (id, project_name, target_sample, province, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      'Survei Respon Siswa terhadap Narasi Radikal Terorisme di Media Sosial',
      400,
      'Jawa Barat',
      'ACTIVE',
      adminId
    );
    console.log(`✅ Proyek ${projectId} berhasil dibuat.`);
  }

  // 3. Seed Default Field Enumerators
  const defaultEnumerators = [
    {
      id: 'ENUM-001',
      fullName: 'Ahmad Fauzi, S.Pd',
      phone: '081234567890',
      school: 'SMK N 3 BANDUNG',
      pin: '123456'
    },
    {
      id: 'ENUM-002',
      fullName: 'Nurul Hidayati, S.Sos',
      phone: '081398765432',
      school: 'SMA N 1 BANDUNG',
      pin: '654321'
    },
    {
      id: 'ENUM-003',
      fullName: 'Rian Pratama',
      phone: '081511223344',
      school: 'SMK N 2 BANDUNG',
      pin: '789012'
    },
    {
      id: 'ENUM-004',
      fullName: 'Dewi Lestari',
      phone: '081822334455',
      school: 'MAN 1 KOTA BANDUNG',
      pin: '345678'
    }
  ];

  for (const enumData of defaultEnumerators) {
    const exists = db.prepare('SELECT id FROM enumerators WHERE id = ?').get(enumData.id);
    if (!exists) {
      db.prepare(`
        INSERT INTO enumerators (id, project_id, full_name, phone_number, assigned_school, pin_hash, pin_raw, status, total_submissions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        enumData.id,
        projectId,
        enumData.fullName,
        enumData.phone,
        enumData.school,
        hashString(enumData.pin),
        enumData.pin,
        'ACTIVE'
      );
      console.log(`✅ Enumerator ${enumData.fullName} (PIN: ${enumData.pin}) terdaftar.`);
    }
  }

  // 4. Injeksi Data Riil dari Excel (Jawa Barat - Input Hasil Survey Respon Siswa.xlsx)
  const excelFilePath = path.join(process.cwd(), 'Jawa Barat - Input Hasil Survey Respon Siswa.xlsx');
  if (fs.existsSync(excelFilePath)) {
    const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM survey_responses WHERE project_id = ?').get(projectId).cnt;
    if (existingCount === 0) {
      console.log('📂 Mengimpor data empiris dari file Excel Jawa Barat...');
      try {
        const responses = parseExcelSurveyData(excelFilePath);
        console.log(`📊 Ditemukan ${responses.length} baris data responden valid di Excel.`);

        const insertStmt = db.prepare(`
          INSERT INTO survey_responses (
            id, project_id, enumerator_id, student_name, gender, religion, grade,
            school_name, social_media_duration, favorite_social_media, favorite_content,
            raw_responses, scored_responses, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let inserted = 0;
        db.transaction(() => {
          for (let i = 0; i < responses.length; i++) {
            const r = responses[i];
            const respId = generateId(`RESP-JB-${String(i + 1).padStart(3, '0')}`);
            const scored = scoreAllResponses(r.rawResponses);
            
            insertStmt.run(
              respId,
              projectId,
              'ENUM-001', // Terhubung ke enumerator SMK N 3 BANDUNG
              `Responden ${i + 1}`,
              r.gender || 'Perempuan',
              r.religion || 'Islam',
              r.grade || 'X',
              r.school || 'SMK N 3 BANDUNG',
              r.duration || '3-5 jam',
              r.favoriteMedia || 'TikTok',
              JSON.stringify(r.favoriteContent || ['Musik']),
              JSON.stringify(r.rawResponses),
              JSON.stringify(scored),
              new Date().toISOString()
            );
            inserted++;
          }
        })();

        // Update total submission enumerator
        db.prepare('UPDATE enumerators SET total_submissions = ? WHERE id = ?').run(inserted, 'ENUM-001');
        console.log(`🎉 Berhasil memasukkan ${inserted} data survei riil Jawa Barat ke database!`);
      } catch (err) {
        console.error('⚠️ Gagal membaca data Excel:', err.message);
      }
    } else {
      console.log(`ℹ️ Data survei sudah terisi (${existingCount} responden).`);
    }
  } else {
    console.log('ℹ️ File Excel tidak ditemukan, lewati import otomatis.');
  }

  console.log('🏁 Proses seeding selesai dengan sukses!');
}

import { parseSurveyExcel } from './excelParser.js';

/**
 * Parser file XLSX murni JavaScript
 */
export function parseExcelSurveyData(filePath) {
  return parseSurveyExcel(filePath);
}

// Jika dijalankan langsung dari CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed();
}
