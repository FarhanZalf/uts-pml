const statusConfig = {
  // Order statuses
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Dikonfirmasi' },
  processing: { bg: '#E0E7FF', text: '#4338CA', label: 'Diproses' },
  diproses: { bg: '#E0E7FF', text: '#4338CA', label: 'Diproses' },
  ready: { bg: '#CFFAFE', text: '#0E7490', label: 'Siap Diambil/Kirim' },
  completed: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
  selesai: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Dibatalkan' },
  dibatalkan: { bg: '#FEE2E2', text: '#991B1B', label: 'Dibatalkan' },

  // Payment statuses
  unpaid: { bg: '#FEE2E2', text: '#991B1B', label: 'Belum Bayar' },
  partial: { bg: '#FEF3C7', text: '#92400E', label: 'Sebagian / DP' },
  paid: { bg: '#D1FAE5', text: '#065F46', label: 'Lunas' },

  // Finance types
  income: { bg: '#D1FAE5', text: '#065F46', label: 'Pemasukan' },
  pemasukan: { bg: '#D1FAE5', text: '#065F46', label: 'Pemasukan' },
  expense: { bg: '#FEE2E2', text: '#991B1B', label: 'Pengeluaran' },
  pengeluaran: { bg: '#FEE2E2', text: '#991B1B', label: 'Pengeluaran' },

  // Roles
  admin: { bg: '#F3E8FF', text: '#6B21A8', label: 'Admin' },
  staff: { bg: '#E0F2FE', text: '#0369A1', label: 'Staff' },
  karyawan: { bg: '#E0F2FE', text: '#0369A1', label: 'Staff' },

  // Status ketersediaan
  active: { bg: '#D1FAE5', text: '#065F46', label: 'Aktif' },
  inactive: { bg: '#F1F5F9', text: '#475569', label: 'Nonaktif' },
};

export default function StatusBadge({ status, label, size = 'md' }) {
  const normalizedKey = typeof status === 'string' ? status.toLowerCase() : '';
  const config = statusConfig[normalizedKey] || {
    bg: '#F1F5F9',
    text: '#475569',
    label: label || status || '-',
  };

  const displayText = label || config.label;
  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSm ? '2px 8px' : '4px 10px',
        borderRadius: '9999px',
        fontSize: isSm ? '11px' : '12px',
        fontWeight: '600',
        lineHeight: '1',
        backgroundColor: config.bg,
        color: config.text,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {displayText}
    </span>
  );
}
