import { NextResponse } from 'next/server';
import { getDb, hashString } from '@/lib/db.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan kata sandi wajib diisi' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, password_hash, name, role FROM admin_users WHERE email = ?').get(email.trim().toLowerCase());

    if (!user) {
      return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai' }, { status: 401 });
    }

    const passHash = hashString(password);
    if (user.password_hash !== passHash) {
      return NextResponse.json({ error: 'Email atau kata sandi tidak sesuai' }, { status: 401 });
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Set cookie sederhana untuk sesi admin
    res.cookies.set('admin_session', JSON.stringify({ id: user.id, email: user.email, name: user.name }), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    });

    return res;
  } catch (err) {
    console.error('Error admin login:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
