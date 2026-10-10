import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import paymentService from '../services/paymentService';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function PembayaranPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const isAdmin = can('admin');

  // List states
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [totalNominal, setTotalNominal] = useState(0);

  // Filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = { page, per_page: 10 };
      if (orderSearch.trim()) params.order_id = orderSearch.trim();
      if (methodFilter) params.metode = methodFilter;
      if (typeFilter) params.tipe = typeFilter;
      if (startDate) params.tanggal_start = startDate;
      if (endDate) params.tanggal_end = endDate;

      const response = await paymentService.getPayments(params);
      setPayments(response.data || []);

      if (response.meta) {
        setPagination({
          current_page: response.meta.current_page || 1,
          last_page: response.meta.last_page || 1,
          total: response.meta.total || 0,
        });
        setTotalNominal(response.meta.total_nominal || 0);
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat riwayat pembayaran.');
      showToast('Gagal memuat data pembayaran.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, orderSearch, methodFilter, typeFilter, startDate, endDate, showToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleResetFilter = () => {
    setOrderSearch('');
    setMethodFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleOpenDetail = async (payment) => {
    setSelectedPayment(payment);
    setDetailModalOpen(true);
    setLoadingDetail(true);

    try {
      const res = await paymentService.getPayment(payment.id);
      setSelectedPayment(res.data);
    } catch {
      // Use existing row data if individual fetch fails
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenDelete = (payment) => {
    setPaymentToDelete(payment);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!paymentToDelete) return;
    setDeleting(true);
    try {
      await paymentService.deletePayment(paymentToDelete.id);
      showToast('Data pembayaran berhasil dihapus.', 'success');
      setDeleteConfirmOpen(false);
      setPaymentToDelete(null);
      fetchPayments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus pembayaran.';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatRupiah = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const columns = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (row) => (
        <span style={{ fontWeight: '500', color: '#1E293B', whiteSpace: 'nowrap' }}>
          {formatDate(row.tanggal)}
        </span>
      ),
    },
    {
      key: 'kode_pesanan',
      label: 'Kode Pesanan',
      render: (row) => (
        <div>
          <span style={{ fontWeight: '600', color: '#4F46E5' }}>
            {row.kode_pesanan || row.order?.kode_pesanan || `Order #${row.order_id}`}
          </span>
          {row.order?.customer_name && (
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              {row.order.customer_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'tipe',
      label: 'Tipe',
      render: (row) => (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: '#F1F5F9',
            fontSize: '11px',
            fontWeight: '600',
            color: '#334155',
            textTransform: 'uppercase',
          }}
        >
          {row.tipe || 'Pembayaran'}
        </span>
      ),
    },
    {
      key: 'metode',
      label: 'Metode',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#475569', textTransform: 'capitalize' }}>
          {row.metode || '-'}
        </span>
      ),
    },
    {
      key: 'nominal',
      label: 'Nominal Dibayar',
      align: 'right',
      render: (row) => (
        <span
          style={{
            fontWeight: '700',
            fontFamily: 'monospace',
            color: '#16A34A',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {formatRupiah(row.nominal)}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Diterima Oleh',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          {row.user?.name || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => handleOpenDetail(row)}
            style={{
              padding: '6px 9px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Lihat detail pembayaran"
          >
            <Eye size={13} />
            <span>Detail</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleOpenDelete(row)}
              style={{
                padding: '6px 9px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#DC2626',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Hapus pembayaran (Khusus Admin)"
            >
              <Trash2 size={13} />
              <span>Hapus</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <CreditCard size={24} color="#4F46E5" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Daftar Pembayaran Masuk
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Rekapitulasi pembayaran pesanan masuk ({pagination.total} pembayaran tercatat)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchPayments}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#475569',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            title="Segarkan data"
          >
            <RefreshCw size={15} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={22} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Total Nominal Pembayaran Terkumpul
            </span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#16A34A', marginTop: '2px' }}>
              {formatRupiah(totalNominal)}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#64748B' }}>
          Total Transaksi: <strong>{pagination.total} kali</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          backgroundColor: '#FFFFFF',
          padding: '14px 16px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: '1', minWidth: '220px', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              placeholder="Filter Order ID (contoh: 1, 2)..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 34px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Cari
          </button>
        </form>

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="">Semua Metode</option>
          <option value="transfer">Transfer Bank</option>
          <option value="tunai">Tunai / Cash</option>
          <option value="qris">QRIS</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="">Semua Tipe</option>
          <option value="dp">Uang Muka (DP)</option>
          <option value="pelunasan">Pelunasan</option>
          <option value="penuh">Bayar Penuh</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Dari:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Sampai:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
              outline: 'none',
            }}
          />
        </div>

        {(orderSearch || methodFilter || typeFilter || startDate || endDate) && (
          <button
            type="button"
            onClick={handleResetFilter}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#64748B',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Error state */}
      {fetchError && (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="#DC2626" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchPayments}
            style={{
              background: 'transparent',
              border: '1px solid #DC2626',
              color: '#DC2626',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="Belum ada riwayat pembayaran yang tercatat."
      />

      {/* Pagination controls */}
      {pagination.last_page > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            fontSize: '13px',
            color: '#64748B',
          }}
        >
          <div>
            Menampilkan halaman {pagination.current_page} dari {pagination.last_page} (Total {pagination.total} pembayaran)
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
                opacity: page <= 1 || loading ? 0.6 : 1,
              }}
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= pagination.last_page || loading}
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                cursor: page >= pagination.last_page || loading ? 'not-allowed' : 'pointer',
                opacity: page >= pagination.last_page || loading ? 0.6 : 1,
              }}
            >
              Selanjutnya <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Pembayaran */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Rincian Pembayaran #${selectedPayment?.id || ''}`}
        maxWidth="500px"
        footer={
          <button
            type="button"
            onClick={() => setDetailModalOpen(false)}
            style={{
              padding: '8px 18px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        }
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
            Memuat rincian pembayaran...
          </div>
        ) : selectedPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info card */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Nominal Diterima:</span>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#16A34A', marginTop: '2px' }}>
                  {formatRupiah(selectedPayment.nominal)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Metode:</span>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', textTransform: 'capitalize' }}>
                  {selectedPayment.metode}
                </div>
              </div>
            </div>

            {/* Grid details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Kode Pesanan</div>
                <div style={{ fontWeight: '600', color: '#4F46E5' }}>
                  {selectedPayment.kode_pesanan || selectedPayment.order?.kode_pesanan || `Order #${selectedPayment.order_id}`}
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Tipe Pembayaran</div>
                <div style={{ fontWeight: '600', color: '#1E293B', textTransform: 'capitalize' }}>
                  {selectedPayment.tipe || 'Pembayaran'}
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Tanggal Bayar</div>
                <div style={{ fontWeight: '600', color: '#1E293B' }}>
                  {formatDate(selectedPayment.tanggal)}
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Dicatat Oleh</div>
                <div style={{ fontWeight: '600', color: '#1E293B' }}>
                  {selectedPayment.user?.name || '-'}
                </div>
              </div>
            </div>

            {/* Catatan */}
            {selectedPayment.catatan && (
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '13px' }}>
                <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Catatan / Keterangan</div>
                <div style={{ color: '#334155' }}>{selectedPayment.catatan}</div>
              </div>
            )}

            {/* Bukti Bayar */}
            {selectedPayment.bukti_bayar && (
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '13px' }}>
                <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '6px' }}>Bukti Pembayaran</div>
                {selectedPayment.bukti_bayar.startsWith('http') ? (
                  <a
                    href={selectedPayment.bukti_bayar}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#4F46E5', textDecoration: 'underline' }}
                  >
                    Buka File Bukti Bayar
                  </a>
                ) : (
                  <div style={{ color: '#334155', fontFamily: 'monospace' }}>
                    {selectedPayment.bukti_bayar}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Data Pembayaran"
        message={`Apakah Anda yakin ingin menghapus data pembayaran sebesar ${formatRupiah(paymentToDelete?.nominal)} untuk pesanan ${paymentToDelete?.kode_pesanan || ''}? Status pesanan dan mutasi arus kas terkait akan otomatis disesuaikan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        loading={deleting}
      />
    </div>
  );
}
