import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, AlertTriangle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import FormField from '../components/common/FormField';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [rateLimitError, setRateLimitError] = useState('');

  // If already logged in, navigate away
  const from = location.state?.from?.pathname || '/';
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});
    setRateLimitError('');

    if (!email.trim() || !password) {
      setGeneralError('Harap isi email dan password.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      showToast('Login berhasil! Selamat datang.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;

        if (status === 422) {
          // Validation error
          setGeneralError(data.message || 'Validasi data gagal.');
          if (data.errors) {
            setFieldErrors(data.errors);
          }
        } else if (status === 429) {
          // Throttled rate limit error
          setRateLimitError(
            data.message || 'Terlalu banyak percobaan login. Silakan tunggu 1 menit lalu coba kembali.'
          );
        } else if (status === 401) {
          // Invalid credentials
          setGeneralError(data.message || 'Email atau password yang Anda masukkan salah.');
        } else {
          setGeneralError(data.message || `Terjadi kesalahan (Kode: ${status}).`);
        }
      } else if (err.request) {
        setGeneralError('Tidak dapat terhubung ke server API. Pastikan backend aktif.');
      } else {
        setGeneralError('Terjadi kesalahan saat memproses login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        padding: '20px',
        backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
              marginBottom: '14px',
            }}
          >
            🥖
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
            Erles Bakery ERP
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
            Masuk ke panel manajemen admin & staff
          </p>
        </div>

        {/* 429 Rate Limit Alert */}
        {rateLimitError && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>Akses Dibatasi (429)</div>
              <div>{rateLimitError}</div>
            </div>
          </div>
        )}

        {/* General Error Alert */}
        {generalError && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{generalError}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            required
            error={fieldErrors.email}
            htmlFor="email"
          >
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                id="email"
                type="email"
                placeholder="admin@erlesbakery.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: fieldErrors.email ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </FormField>

          <FormField
            label="Password"
            required
            error={fieldErrors.password}
            htmlFor="password"
          >
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: fieldErrors.password ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </FormField>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '12px',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Masuk ke Akun</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #F1F5F9',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          Masuk dengan akun admin atau staff yang telah terdaftar di database.
        </div>
      </div>
    </div>
  );
}
