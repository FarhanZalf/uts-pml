import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Eye,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Ban,
  Clock,
  Trash2,
  DollarSign,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import orderService from '../services/orderService';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function PesananPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const isAdmin = can('admin');

  // List states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Change status modal inside detail or standalone
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusCatatan, setStatusCatatan] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Cancel order dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Delete order dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Payment form states (inside detail)
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentFormData, setPaymentFormData] = useState({
    nominal: '',
    metode: 'transfer',
    tipe: 'lunas',
    tanggal: new Date().toISOString().split('T')[0],
    catatan: '',
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await orderService.getOrders(params);
      setOrders(response.data || []);
      if (response.meta) {
        setPagination({
          current_page: response.meta.current_page || 1,
          last_page: response.meta.last_page || 1,
          total: response.meta.total || 0,
        });
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat daftar pesanan.');
      showToast('Gagal memuat pesanan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const loadOrderPayments = async (orderId) => {
    setLoadingPayments(true);
    try {
      const res = await orderService.getPayments(orderId);
      setPayments(res.data || []);
    } catch {
      // Payment fetch error
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleOpenDetail = async (order) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    setShowPaymentForm(false);
    setPaymentErrors({});
    try {
      const res = await orderService.getOrder(order.id);
      setActiveOrder(res.data);
      // Pre-fill payment default nominal with remaining balance
      const sisa = res.data.sisa_pembayaran || Math.max(0, res.data.total_price - (res.data.paid_amount || 0));
      setPaymentFormData({
        nominal: sisa > 0 ? sisa : '',
        metode: 'transfer',
        tipe: sisa >= res.data.total_price ? 'lunas' : 'pelunasan',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: '',
      });
      loadOrderPayments(order.id);
    } catch {
      showToast('Gagal memuat detail pesanan.', 'error');
      setDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open status transition modal
  const handleOpenStatusModal = (order) => {
    setActiveOrder(order);
    setSelectedStatus('');
    setStatusCatatan('');
    setStatusError('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeOrder || !selectedStatus) return;
    setUpdatingStatus(true);
    setStatusError('');

    try {
      const res = await orderService.updateStatus(activeOrder.id, selectedStatus, statusCatatan);
      showToast(res.message || `Status pesanan diubah ke "${selectedStatus}".`, 'success');
      setStatusModalOpen(false);
      // Update active order if detail modal is also open
      setActiveOrder(res.data);
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah status pesanan.';
      setStatusError(msg);
      showToast(msg, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Cancel order flow
  const handleOpenCancel = (order) => {
    setActiveOrder(order);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!activeOrder) return;
    setCancelling(true);
    try {
      const res = await orderService.cancelOrder(activeOrder.id, cancelReason);
      showToast(res.message || 'Pesanan berhasil dibatalkan.', 'success');
      setCancelDialogOpen(false);
      if (detailModalOpen) {
        setActiveOrder(res.data);
      }
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membatalkan pesanan.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Delete order flow (Admin only)
  const handleOpenDelete = (order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await orderService.deleteOrder(orderToDelete.id);
      showToast(`Pesanan "${orderToDelete.kode_pesanan}" berhasil dihapus.`, 'success');
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      if (detailModalOpen && activeOrder?.id === orderToDelete.id) {
        setDetailModalOpen(false);
      }
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus pesanan.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Payment form submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    setPaymentSubmitting(true);
    setPaymentErrors({});

    const payload = {
      ...paymentFormData,
      nominal: parseFloat(paymentFormData.nominal),
    };

    try {
      await orderService.createPayment(activeOrder.id, payload);
      showToast('Pembayaran berhasil dicatat.', 'success');
      setShowPaymentForm(false);
      // Reload order details & payment list
      const updatedOrderRes = await orderService.getOrder(activeOrder.id);
      setActiveOrder(updatedOrderRes.data);
      loadOrderPayments(activeOrder.id);
      fetchOrders();
    } catch (err) {
      if (err.response?.status === 422) {
        setPaymentErrors(err.response.data.errors || {});
        showToast(err.response.data.message || 'Validasi pembayaran gagal.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Gagal mencatat pembayaran.', 'error');
      }
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const formatRupiah = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Allowed transitions based on backend Order model
  const getAllowedStatuses = (currentStatus) => {
    const norm = currentStatus ? currentStatus.toLowerCase() : '';
    switch (norm) {
      case 'pending':
        return [
          { value: 'confirmed', label: 'Dikonfirmasi (confirmed)' },
          { value: 'processing', label: 'Diproses Produksi (processing)' },
          { value: 'cancelled', label: 'Dibatalkan (cancelled)' },
        ];
      case 'confirmed':
        return [
          { value: 'processing', label: 'Diproses Produksi (processing)' },
          { value: 'cancelled', label: 'Dibatalkan (cancelled)' },
        ];
      case 'processing':
      case 'diproses':
        return [
          { value: 'ready', label: 'Siap Diambil/Kirim (ready)' },
          { value: 'completed', label: 'Selesai (completed)' },
          { value: 'cancelled', label: 'Dibatalkan (cancelled)' },
        ];
      case 'ready':
        return [
          { value: 'completed', label: 'Selesai (completed)' },
          { value: 'cancelled', label: 'Dibatalkan (cancelled)' },
        ];
      default:
        return [];
    }
  };

  const columns = [
    {
      key: 'kode_pesanan',
      label: 'Kode Pesanan',
      render: (row) => (
        <div>
          <span style={{ fontWeight: '700', color: '#4F46E5', fontSize: '13px' }}>
            {row.kode_pesanan}
          </span>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
            {row.created_at ? row.created_at.split('T')[0] : '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Pelanggan',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: '#0F172A' }}>{row.customer_name}</div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>{row.customer_phone}</div>
        </div>
      ),
    },
    {
      key: 'total_price',
      label: 'Total Tagihan',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '700', color: '#0F172A' }}>
            {formatRupiah(row.total_price)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            Dibayar: {formatRupiah(row.paid_amount)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Pesanan',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment_status',
      label: 'Pembayaran',
      align: 'center',
      render: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      key: 'tanggal_ambil',
      label: 'Tgl Ambil',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#475569' }}>
          {row.tanggal_ambil || '-'}
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
              color: '#4338CA',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Lihat Detail & Pembayaran"
          >
            <Eye size={13} />
            <span>Detail</span>
          </button>
          {!['completed', 'selesai', 'cancelled', 'dibatalkan'].includes(row.status?.toLowerCase()) && (
            <button
              type="button"
              onClick={() => handleOpenStatusModal(row)}
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
              title="Ubah Status Pesanan"
            >
              <Clock size={13} />
              <span>Status</span>
            </button>
          )}
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
              title="Aksi khusus Admin"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <ShoppingBag size={24} color="#4F46E5" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Kelola Pesanan
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Pelacakan status pesanan masuk dan verifikasi pembayaran ({pagination.total} pesanan)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchOrders}
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: '1', minWidth: '240px', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Cari kode pesanan, nama pemesan, no telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
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
          <option value="">Semua Status Pesanan</option>
          <option value="pending">Menunggu (pending)</option>
          <option value="confirmed">Dikonfirmasi (confirmed)</option>
          <option value="processing">Diproses (processing)</option>
          <option value="ready">Siap (ready)</option>
          <option value="completed">Selesai (completed)</option>
          <option value="cancelled">Dibatalkan (cancelled)</option>
        </select>
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
            onClick={fetchOrders}
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
        data={orders}
        loading={loading}
        emptyMessage="Tidak ada pesanan ditemukan sesuai kriteria filter."
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
            Menampilkan halaman {pagination.current_page} dari {pagination.last_page} (Total {pagination.total} pesanan)
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

      {/* Modal Detail Pesanan Lengkap */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Detail Pesanan: ${activeOrder?.kode_pesanan || ''}`}
        maxWidth="740px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!['completed', 'selesai', 'cancelled', 'dibatalkan'].includes(activeOrder?.status?.toLowerCase()) && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenStatusModal(activeOrder)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#1E293B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={14} /> Ubah Status
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCancel(activeOrder)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Ban size={14} /> Batalkan
                  </button>
                </>
              )}
            </div>

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
          </div>
        }
      >
        {loadingDetail ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }} />
            <div>Memuat rincian pesanan...</div>
          </div>
        ) : activeOrder ? (
          <div>
            {/* Top Info Banner */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid #E2E8F0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Status Pesanan</span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={activeOrder.status} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Status Pembayaran</span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={activeOrder.payment_status} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Tanggal Pengambilan</span>
                <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '600', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="#6366F1" />
                  {activeOrder.tanggal_ambil || 'Langsung'}
                </div>
              </div>
            </div>

            {/* Pelanggan & Alamat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} /> Data Pemesan
                </div>
                <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>{activeOrder.customer_name}</div>
                <div style={{ color: '#64748B', fontSize: '13px', marginTop: '2px' }}>{activeOrder.customer_phone}</div>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> Alamat & Catatan
                </div>
                <div style={{ color: '#1E293B', fontSize: '13px' }}>{activeOrder.alamat || 'Ambil di Toko (Tanpa Antar)'}</div>
                {activeOrder.catatan && (
                  <div style={{ fontSize: '12px', color: '#D97706', marginTop: '4px', backgroundColor: '#FFFBEB', padding: '4px 6px', borderRadius: '4px' }}>
                    📝 {activeOrder.catatan}
                  </div>
                )}
              </div>
            </div>

            {/* Rincian Item Produk */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginBottom: '10px' }}>
                Daftar Item Pesanan
              </h4>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569' }}>Produk</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', color: '#475569' }}>Qty</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>Harga Satuan</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrder.items?.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '500', color: '#0F172A' }}>
                          {item.product?.nama || `Produk #${item.product_id}`}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: '#334155' }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>
                          {formatRupiah(item.unit_price)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#0F172A' }}>
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#F8FAFC', fontWeight: '700' }}>
                      <td colSpan={3} style={{ padding: '12px 14px', textAlign: 'right', color: '#334155' }}>
                        Total Tagihan:
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4F46E5', fontSize: '15px' }}>
                        {formatRupiah(activeOrder.total_price)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Rekapitulasi Pembayaran & Riwayat Payment */}
            <div style={{ borderTop: '2px dashed #E2E8F0', paddingTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} color="#16A34A" /> Status & Pembayaran Pesanan
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Dibayar: <strong style={{ color: '#16A34A' }}>{formatRupiah(activeOrder.paid_amount)}</strong> | Sisa: <strong style={{ color: activeOrder.sisa_pembayaran > 0 ? '#DC2626' : '#16A34A' }}>{formatRupiah(activeOrder.sisa_pembayaran)}</strong>
                  </div>
                </div>

                {!showPaymentForm && activeOrder.sisa_pembayaran > 0 && activeOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(true)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    + Catat Pembayaran
                  </button>
                )}
              </div>

              {/* Form Input Pembayaran Baru */}
              {showPaymentForm && (
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#166534', margin: '0 0 12px 0' }}>
                    Form Input Pembayaran Baru
                  </h5>
                  <form onSubmit={handlePaymentSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <FormField label="Nominal Dibayar (Rp)" required error={paymentErrors.nominal} htmlFor="pay-amount">
                        <input
                          id="pay-amount"
                          type="number"
                          min="1"
                          max={activeOrder.sisa_pembayaran}
                          required
                          value={paymentFormData.nominal}
                          onChange={(e) => setPaymentFormData((prev) => ({ ...prev, nominal: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: paymentErrors.nominal ? '1px solid #DC2626' : '1px solid #CBD5E1',
                            fontSize: '13px',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </FormField>

                      <FormField label="Metode Pembayaran" required error={paymentErrors.metode} htmlFor="pay-method">
                        <select
                          id="pay-method"
                          value={paymentFormData.metode}
                          onChange={(e) => setPaymentFormData((prev) => ({ ...prev, metode: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="transfer">Transfer Bank</option>
                          <option value="cash">Tunai / Cash</option>
                          <option value="qris">QRIS</option>
                          <option value="debit">Kartu Debit</option>
                        </select>
                      </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <FormField label="Tipe Pembayaran" required error={paymentErrors.tipe} htmlFor="pay-type">
                        <select
                          id="pay-type"
                          value={paymentFormData.tipe}
                          onChange={(e) => setPaymentFormData((prev) => ({ ...prev, tipe: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="lunas">Lunas</option>
                          <option value="dp">Uang Muka (DP)</option>
                          <option value="pelunasan">Pelunasan</option>
                          <option value="cicilan">Cicilan</option>
                        </select>
                      </FormField>

                      <FormField label="Tanggal Bayar" required error={paymentErrors.tanggal} htmlFor="pay-date">
                        <input
                          id="pay-date"
                          type="date"
                          required
                          value={paymentFormData.tanggal}
                          onChange={(e) => setPaymentFormData((prev) => ({ ...prev, tanggal: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </FormField>
                    </div>

                    <FormField label="Catatan Pembayaran (Opsional)" error={paymentErrors.catatan} htmlFor="pay-notes">
                      <input
                        id="pay-notes"
                        type="text"
                        placeholder="Contoh: Transfer via BCA a.n Budi, bukti valid"
                        value={paymentFormData.catatan}
                        onChange={(e) => setPaymentFormData((prev) => ({ ...prev, catatan: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          backgroundColor: '#FFFFFF',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </FormField>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setShowPaymentForm(false)}
                        disabled={paymentSubmitting}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={paymentSubmitting}
                        style={{
                          padding: '6px 16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#16A34A',
                          color: '#FFFFFF',
                          cursor: paymentSubmitting ? 'not-allowed' : 'pointer',
                          opacity: paymentSubmitting ? 0.7 : 1,
                        }}
                      >
                        {paymentSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabel Riwayat Pembayaran Pesanan */}
              {loadingPayments ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  Memuat daftar pembayaran...
                </div>
              ) : payments.length > 0 ? (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', color: '#64748B' }}>Tanggal</th>
                        <th style={{ padding: '8px 12px', color: '#64748B' }}>Metode</th>
                        <th style={{ padding: '8px 12px', color: '#64748B' }}>Tipe</th>
                        <th style={{ padding: '8px 12px', color: '#64748B' }}>Catatan</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#64748B' }}>Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>{p.tanggal}</td>
                          <td style={{ padding: '8px 12px', textTransform: 'capitalize', fontWeight: '500' }}>{p.metode}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ backgroundColor: '#E0E7FF', color: '#4338CA', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontSize: '10px', fontWeight: '700' }}>
                              {p.tipe}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{p.catatan || '-'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#16A34A' }}>
                            {formatRupiah(p.nominal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', color: '#94A3B8', fontSize: '13px' }}>
                  Belum ada pembayaran yang dicatat untuk pesanan ini.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal Ubah Status Pesanan */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => !updatingStatus && setStatusModalOpen(false)}
        title={`Ubah Status Pesanan: ${activeOrder?.kode_pesanan || ''}`}
        maxWidth="440px"
        footer={
          <>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => setStatusModalOpen(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                cursor: updatingStatus ? 'not-allowed' : 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              form="status-form"
              disabled={updatingStatus || !selectedStatus}
              style={{
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: '#4F46E5',
                color: '#FFFFFF',
                cursor: updatingStatus || !selectedStatus ? 'not-allowed' : 'pointer',
                opacity: updatingStatus || !selectedStatus ? 0.6 : 1,
              }}
            >
              {updatingStatus ? 'Menyimpan...' : 'Perbarui Status'}
            </button>
          </>
        }
      >
        <form id="status-form" onSubmit={handleUpdateStatus}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            <span style={{ color: '#64748B' }}>Status saat ini: </span>
            <StatusBadge status={activeOrder?.status} />
          </div>

          {statusError && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
              {statusError}
            </div>
          )}

          <FormField label="Pilih Status Baru" required htmlFor="order-status-select">
            <select
              id="order-status-select"
              required
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="">-- Pilih Status Berikutnya --</option>
              {getAllowedStatuses(activeOrder?.status).map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Catatan Tambahan (Opsional)" htmlFor="status-catatan">
            <textarea
              id="status-catatan"
              rows={2}
              placeholder="Contoh: Roti sudah siap di etalase, pelanggan dikonfirmasi"
              value={statusCatatan}
              onChange={(e) => setStatusCatatan(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </FormField>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Pembatalan Pesanan */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Batalkan Pesanan"
        message={
          <div>
            <p style={{ margin: '0 0 10px 0' }}>
              Apakah Anda yakin ingin membatalkan pesanan <strong>{activeOrder?.kode_pesanan}</strong>?
            </p>
            <input
              type="text"
              placeholder="Alasan pembatalan (opsional)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        }
        confirmText="Ya, Batalkan Pesanan"
        cancelText="Tutup"
        isDanger={true}
        loading={cancelling}
      />

      {/* Dialog Konfirmasi Hapus Pesanan (Admin Only) */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pesanan"
        message={`Apakah Anda yakin ingin menghapus permanen pesanan "${orderToDelete?.kode_pesanan}"?`}
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        isDanger={true}
        loading={deleting}
      />
    </div>
  );
}
