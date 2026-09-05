import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db.js';

export async function POST(request) {
  try {
    const { pin } = await request.json();
    const cleanPin = (pin || '').trim();

    if (!cleanPin || cleanPin.length !== 6) {
      return NextResponse.json({ error: 'Kode PIN harus berupa 6-digit angka' }, { status: 400 });
    }

    const db = await getDb();
    const enumerator = db.prepare(`
      SELECT e.id, e.project_id, e.full_name, e.phone_number, e.assigned_school, e.status, e.total_submissions,
             p.project_name, p.province, p.status as project_status
      FROM enumerators e
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.pin_raw = ?
    `).get(cleanPin);

    if (!enumerator) {
      return NextResponse.json({ error: 'PIN 6-digit tidak terdaftar di sistem' }, { status: 404 });
    }

    if (enumerator.status === 'REVOKED') {
      return NextResponse.json({
        error: 'Akses PIN Anda telah dikunci/dicabut oleh Peneliti Utama (kuota terpenuhi atau izin dihentikan).'
      }, { status: 403 });
    }

    if (enumerator.project_status === 'CLOSED') {
      return NextResponse.json({
        error: 'Proyek survei ini telah ditutup oleh Peneliti Utama.'
      }, { status: 403 });
    }

    // Ambil jumlah submit hari ini khusus untuk enumerator ini
    const todaySubmissions = db.prepare(`
      SELECT COUNT(*) as count FROM survey_responses
      WHERE enumerator_id = ? AND date(created_at) = date('now')
    `).get(enumerator.id).count;

    const res = NextResponse.json({
      success: true,
      enumerator: {
        id: enumerator.id,
        projectId: enumerator.project_id,
        projectName: enumerator.project_name,
        province: enumerator.province,
        fullName: enumerator.full_name,
        assignedSchool: enumerator.assigned_school,
        totalSubmissions: enumerator.total_submissions,
        todaySubmissions
      }
    });

    res.cookies.set('surveyor_session', JSON.stringify({
      id: enumerator.id,
      pin: cleanPin,
      projectId: enumerator.project_id,
      fullName: enumerator.full_name,
      school: enumerator.assigned_school
    }), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 jam
    });

    return res;
  } catch (err) {
    console.error('Error PIN verification:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get('pin');
  if (!pin) {
    return NextResponse.json({ error: 'Parameter PIN dibutuhkan' }, { status: 400 });
  }

  const db = await getDb();
  const enumerator = db.prepare(`
    SELECT e.id, e.project_id, e.full_name, e.phone_number, e.assigned_school, e.status, e.total_submissions,
           p.project_name, p.province, p.status as project_status
    FROM enumerators e
    LEFT JOIN projects p ON e.project_id = p.id
    WHERE e.pin_raw = ?
  `).get(pin.trim());

  if (!enumerator) {
    return NextResponse.json({ error: 'PIN tidak terdaftar' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    enumerator: {
      id: enumerator.id,
      projectId: enumerator.project_id,
      projectName: enumerator.project_name,
      province: enumerator.province,
      fullName: enumerator.full_name,
      assignedSchool: enumerator.assigned_school,
      status: enumerator.status
    }
  });
}
