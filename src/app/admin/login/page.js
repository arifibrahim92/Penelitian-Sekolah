'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Email atau kata sandi tidak sesuai');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError('Terjadi kesalahan koneksi sistem');
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@survei-damai.id');
    setPassword('admin123456');
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
      padding: '20px 0'
    }}>
      <div className="glass-card" style={{
        maxWidth: 440,
        width: '100%',
        padding: '36px 28px',
        border: '1px solid rgba(79, 70, 229, 0.3)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            background: 'rgba(79, 70, 229, 0.15)',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 20px rgba(79, 70, 229, 0.25)'
          }}>
            <Shield size={28} color="#818cf8" />
          </div>

          <h1 style={{ fontSize: '1.6rem', marginBottom: 6, fontWeight: 800 }}>
            Portal Peneliti / Admin
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Masuk untuk mengelola data survei nasional dan analitik
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--status-critical-bg)',
            border: '1px solid var(--status-critical-border)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Peneliti Utama</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="misal: admin@survei-damai.id"
                className="form-input"
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi Akun</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8, marginBottom: 20 }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk Dashboard Kontrol'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Quick Fill */}
        <div style={{
          paddingTop: 18,
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: '0.82rem' }}
          >
            <Sparkles size={14} color="#818cf8" />
            <span>Isi Otomatis Kredensial Demo Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
