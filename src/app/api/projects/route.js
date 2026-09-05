import { NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db.js';

export async function GET() {
  try {
    const db = await getDb();
    const projects = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM survey_responses r WHERE r.project_id = p.id) as total_responses,
        (SELECT COUNT(*) FROM enumerators e WHERE e.project_id = p.id AND e.status = 'ACTIVE') as active_enumerators,
        (SELECT COUNT(DISTINCT school_name) FROM survey_responses r WHERE r.project_id = p.id) as total_schools
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();

    return NextResponse.json({ success: true, projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return NextResponse.json({ error: 'Gagal memuat data proyek' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { project_name, target_sample = 400, province = 'Jawa Barat' } = body;

    if (!project_name) {
      return NextResponse.json({ error: 'Nama proyek wajib diisi' }, { status: 400 });
    }

    const db = await getDb();
    const projectId = generateId('PRJ-2026');

    db.prepare(`
      INSERT INTO projects (id, project_name, target_sample, province, status, created_by)
      VALUES (?, ?, ?, ?, 'ACTIVE', 'ADMIN')
    `).run(projectId, project_name, parseInt(target_sample, 10), province);

    await db.persist?.();

    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (err) {
    console.error('Error creating project:', err);
    return NextResponse.json({ error: 'Gagal membuat proyek baru' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, project_name, target_sample, province, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID Proyek wajib disertakan' }, { status: 400 });
    }

    const db = await getDb();
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    const updatedName = project_name !== undefined ? project_name : existing.project_name;
    const updatedTarget = target_sample !== undefined ? parseInt(target_sample, 10) : existing.target_sample;
    const updatedProvince = province !== undefined ? province : existing.province;
    const updatedStatus = status !== undefined ? status : existing.status;

    db.prepare(`
      UPDATE projects
      SET project_name = ?, target_sample = ?, province = ?, status = ?
      WHERE id = ?
    `).run(updatedName, updatedTarget, updatedProvince, updatedStatus, id);

    await db.persist?.();

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return NextResponse.json({ success: true, project: updated });
  } catch (err) {
    console.error('Error updating project:', err);
    return NextResponse.json({ error: 'Gagal memperbarui proyek' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Proyek wajib disertakan' }, { status: 400 });
    }

    const db = await getDb();
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    await db.persist?.();

    return NextResponse.json({
      success: true,
      message: `Proyek "${existing.project_name}" beserta seluruh data terkait berhasil dihapus.`
    });
  } catch (err) {
    console.error('Error deleting project:', err);
    return NextResponse.json({ error: 'Gagal menghapus proyek' }, { status: 500 });
  }
}
