import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Users,
  CreditCard,
  Wallet,
  X,
} from 'lucide-react';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/produk', label: 'Produk', icon: Package },
  { to: '/kategori', label: 'Kategori', icon: Tags },
  { to: '/pelanggan', label: 'Pelanggan', icon: Users },
  { to: '/pembayaran', label: 'Pembayaran', icon: CreditCard },
  { to: '/keuangan', label: 'Keuangan', icon: Wallet },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        className={`admin-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '240px',
          height: '100vh',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
              }}
            >
              🥖
            </div>
            <div>
              <h1
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Erles Bakery
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  color: '#94A3B8',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontWeight: '500',
                }}
              >
                ERP Admin
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mobile-sidebar-close"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
            title="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto',
          }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  backgroundColor: isActive ? '#4F46E5' : 'transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '11px',
            color: '#64748B',
            textAlign: 'center',
          }}
        >
          Erles Bakery v1.0.0
        </div>
      </aside>
    </>
  );
}
