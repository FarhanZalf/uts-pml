import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      showToast('Berhasil keluar dari akun.', 'info');
      navigate('/login');
    } catch {
      showToast('Gagal memproses logout.', 'error');
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <header
        style={{
          height: '64px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        {/* Left side / Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              color: '#475569',
            }}
            className="mobile-menu-btn"
            title="Buka Menu"
          >
            <Menu size={20} />
          </button>
          <div style={{ fontSize: '14px', color: '#64748B' }}>
            Panel Administrasi
          </div>
        </div>

        {/* Right side: User profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>
                {user?.name || 'Pengguna'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusBadge status={user?.role || 'staff'} size="sm" />
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{user?.email}</span>
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', backgroundColor: '#E2E8F0' }} />

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#EF4444',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEF2F2';
              e.currentTarget.style.borderColor = '#FECACA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari sistem Erles Bakery ERP?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        isDanger={true}
        loading={loggingOut}
      />
    </>
  );
}
