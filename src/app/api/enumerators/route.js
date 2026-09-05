import { NextResponse } from 'next/server';
import { getDb, generateId, generateRandomPin, hashString } from '@/lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const db = getDb();
    let query = `
      SELECT e.*,
             (SELECT COUNT(*) FROM survey_responses r WHERE r.enumerator_id = e.id AND date(r.created_at) = date('now')) as today_submissions
      FROM enumerators e
    `;
    const params = [];

    if (projectId) {
      query += ' WHERE e.project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY e.created_at DESC';

    const enumerators = db.prepare(query).all(...params);
    return NextResponse.json({ success: true, enumerators });
  } catch (err) {
    console.error('Error fetching enumerators:', err);
    return NextResponse.json({ error: 'Gagal memuat daftar enumerator' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, fullName, phoneNumber, assignedSchool, customPin } = body;

    if (!fullName || !projectId) {
      return NextResponse.json({ error: 'Nama enumerator dan proyek wajib diisi' }, { status: 400 });
    }

    const db = getDb();

    // Pastikan PIN 6 digit unik
    let pinRaw = (customPin || '').trim();
    if (!pinRaw || pinRaw.length !== 6 || !/^\d{6}$/.test(pinRaw)) {
      // Generate acak dan pastikan belum dipakai
      let isUnique = false;
      while (!isUnique) {
        pinRaw = generateRandomPin();
        const existing = db.prepare('SELECT id FROM enumerators WHERE pin_raw = ?').get(pinRaw);
        if (!existing) isUnique = true;
      }
    } else {
      const existing = db.prepare('SELECT id FROM enumerators WHERE pin_raw = ?').get(pinRaw);
      if (existing) {
        return NextResponse.json({ error: 'PIN ini sudah digunakan oleh enumerator lain' }, { status: 400 });
      }
    }

    const pinHash = hashString(pinRaw);
    const enumId = generateId('ENUM');

    db.prepare(`
      INSERT INTO enumerators (
        id, project_id, full_name, phone_number, assigned_school,
        pin_hash, pin_raw, status, total_submissions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0)
    `).run(
      enumId,
      projectId,
      fullName.trim(),
      phoneNumber ? phoneNumber.trim() : null,
      assignedSchool ? assignedSchool.trim() : null,
      pinHash,
      pinRaw
    );

    const created = db.prepare('SELECT * FROM enumerators WHERE id = ?').get(enumId);
    return NextResponse.json({ success: true, enumerator: created }, { status: 201 });
  } catch (err) {
    console.error('Error creating enumerator:', err);
    return NextResponse.json({ error: 'Gagal mendaftarkan enumerator' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, regeneratePin, assignedSchool, fullName, phoneNumber } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID enumerator wajib disertakan' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM enumerators WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Enumerator tidak ditemukan' }, { status: 404 });
    }

    let updatedPinRaw = existing.pin_raw;
    let updatedPinHash = existing.pin_hash;

    if (regeneratePin) {
      let isUnique = false;
      while (!isUnique) {
        updatedPinRaw = generateRandomPin();
        const check = db.prepare('SELECT id FROM enumerators WHERE pin_raw = ? AND id != ?').get(updatedPinRaw, id);
        if (!check) isUnique = true;
      }
      updatedPinHash = hashString(updatedPinRaw);
    }

    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedSchool = assignedSchool !== undefined ? assignedSchool : existing.assigned_school;
    const updatedName = fullName !== undefined ? fullName : existing.full_name;
    const updatedPhone = phoneNumber !== undefined ? phoneNumber : existing.phone_number;

    db.prepare(`
      UPDATE enumerators
      SET status = ?, pin_raw = ?, pin_hash = ?, assigned_school = ?, full_name = ?, phone_number = ?
      WHERE id = ?
    `).run(
      updatedStatus,
      updatedPinRaw,
      updatedPinHash,
      updatedSchool,
      updatedName,
      updatedPhone,
      id
    );

    const updated = db.prepare('SELECT * FROM enumerators WHERE id = ?').get(id);
    return NextResponse.json({ success: true, enumerator: updated });
  } catch (err) {
    console.error('Error updating enumerator:', err);
    return NextResponse.json({ error: 'Gagal memperbarui data enumerator' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID enumerator wajib disertakan' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM enumerators WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Enumerator berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting enumerator:', err);
    return NextResponse.json({ error: 'Gagal menghapus enumerator' }, { status: 500 });
  }
}
