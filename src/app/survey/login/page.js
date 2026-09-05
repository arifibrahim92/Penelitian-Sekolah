'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';

function SurveyLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const queryPin = searchParams.get('pin');
    if (queryPin && queryPin.length === 6) {
      setPin(queryPin);
      verifyPin(queryPin);
    }
  }, [searchParams]);

  const verifyPin = async (pinToVerify) => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/pin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToVerify })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'PIN tidak valid atau akses dicabut');
        setLoading(false);
        return;
      }

      router.push('/survey');
    } catch (err) {
      setError('Gagal menghubungi server');
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('Masukkan 6 digit kode PIN enumerator');
      return;
    }
    verifyPin(pin);
  };

  const handleNumpad = (digit) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
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
        textAlign: 'center',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Icon */}
        <div style={{
          width: 58,
          height: 58,
          borderRadius: 16,
          background: 'rgba(6, 182, 212, 0.15)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.25)'
        }}>
          <KeyRound size={28} color="#06b6d4" />
        </div>

        <h1 style={{ fontSize: '1.6rem', marginBottom: 8, fontWeight: 800 }}>
          Portal Surveyor Lapangan
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.5 }}>
          Masukkan <b>PIN Akses 6-Digit</b> yang telah didaftarkan oleh Peneliti Utama untuk memulai survei.
        </p>

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
            gap: 10,
            textAlign: 'left'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Input Display */}
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 24
          }}>
            {[0, 1, 2, 3, 4, 5].map(idx => (
              <div
                key={idx}
                style={{
                  width: 44,
                  height: 52,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: pin[idx] ? '2px solid #06b6d4' : '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: pin[idx] ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {pin[idx] ? '•' : ''}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', marginBottom: 24 }}
          >
            {loading ? 'Memvalidasi PIN...' : 'Buka Formulir Kuesioner'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Virtual Numpad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          maxWidth: 280,
          margin: '0 auto 24px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumpad(num.toString())}
              style={{
                height: 48,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            style={{
              height: 48,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('0')}
            style={{
              height: 48,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            style={{
              height: 48,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              color: '#f87171',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ⌫
          </button>
        </div>

        {/* Demo Quick PIN Helpers */}
        <div style={{
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            PIN ENUMERATOR DEMO / UJI COBA:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setPin('123456'); verifyPin('123456'); }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              123456 (SMK N 3 Bandung)
            </button>
            <button
              onClick={() => { setPin('654321'); verifyPin('654321'); }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              654321 (SMA N 1 Bandung)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SurveyLoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0' }}>Memuat halaman...</div>}>
      <SurveyLoginContent />
    </Suspense>
  );
}
