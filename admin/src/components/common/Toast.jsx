import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    color: '#065F46',
    iconColor: '#10B981',
  },
  error: {
    bg: '#FEF2F2',
    border: '#FECACA',
    color: '#991B1B',
    iconColor: '#EF4444',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    color: '#92400E',
    iconColor: '#F59E0B',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    color: '#1E40AF',
    iconColor: '#3B82F6',
  },
};

export default function Toast({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100vw - 40px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const typeStyle = styles[toast.type] || styles.info;
        const IconComponent = icons[toast.type] || icons.info;

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: typeStyle.bg,
              border: `1px solid ${typeStyle.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              color: typeStyle.color,
              fontSize: '14px',
              lineHeight: '1.4',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            <IconComponent size={20} color={typeStyle.iconColor} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</div>
            <button
              type="button"
              onClick={() => onClose(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: typeStyle.color,
                opacity: 0.7,
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Tutup"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
