import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '32px',
      }}
    >
      <div style={{ fontSize: '64px', fontWeight: '800', color: '#CBD5E1', marginBottom: '8px' }}>
        404
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>
        Halaman Tidak Ditemukan
      </h2>
      <p style={{ color: '#64748B', fontSize: '14px', maxWidth: '400px', marginBottom: '24px' }}>
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          backgroundColor: '#4F46E5',
          color: '#FFFFFF',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        <Home size={16} />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
