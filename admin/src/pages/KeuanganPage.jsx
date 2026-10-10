import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import financeService from '../services/financeService';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function KeuanganPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const isAdmin = can('admin');

  // List & summary states
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_pemasukan: 0,
    total_pengeluaran: 0,
    saldo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filter states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Form modal states (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tipe: 'pengeluaran',
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    kategori: '',
    catatan: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFinances = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.tipe = typeFilter;
      if (categoryFilter.trim()) params.kategori = categoryFilter.trim();
      if (startDate) params.tanggal_mulai = startDate;
      if (endDate) params.tanggal_akhir = endDate;

      const response = await financeService.getFinances(params);
      setTransactions(response.data || []);

      if (response.summary) {
        setSummary({
          total_pemasukan: Number(response.summary.total_pemasukan || 0),
          total_pengeluaran: Number(response.summary.total_pengeluaran || 0),
          saldo: Number(response.summary.saldo || 0),
        });
      }

      if (response.meta) {
        setPagination({
          current_page: response.meta.current_page || 1,
          last_page: response.meta.last_page || 1,
          total: response.meta.total || 0,
        });
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat catatan transaksi keuangan.');
      showToast('Gagal memuat data keuangan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, categoryFilter, startDate, endDate, showToast]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFinances();
  };

  const handleResetFilter = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const setPeriodToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setPage(1);
  };

  const setPeriodThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedTx(null);
    setFormData({
      tipe: 'pengeluaran',
      tanggal: new Date().toISOString().split('T')[0],
      nominal: '',
      kategori: '',
      catatan: '',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setSelectedTx(tx);
    setFormData({
      tipe: tx.tipe || 'pengeluaran',
      tanggal: tx.tanggal ? tx.tanggal.substring(0, 10) : new Date().toISOString().split('T')[0],
      nominal: tx.nominal ?? '',
      kategori: tx.kategori || '',
      catatan: tx.catatan || '',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    try {
      const payload = {
        tipe: formData.tipe,
        tanggal: formData.tanggal,
        nominal: Number(formData.nominal),
        kategori: formData.kategori,
        catatan: formData.catatan || null,
      };

      if (selectedTx) {
        await financeService.updateFinance(selectedTx.id, payload);
        showToast('Transaksi keuangan berhasil diperbarui.', 'success');
      } else {
        await financeService.createFinance(payload);
        showToast('Transaksi keuangan berhasil dicatat.', 'success');
      }
      setModalOpen(false);
      fetchFinances();
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        showToast(err.response.data.message || 'Validasi gagal.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Gagal menyimpan transaksi.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (tx) => {
    setTxToDelete(tx);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!txToDelete) return;
    setDeleting(true);
    try {
      await financeService.deleteFinance(txToDelete.id);
      showToast('Transaksi keuangan berhasil dihapus.', 'success');
      setDeleteConfirmOpen(false);
      setTxToDelete(null);
      fetchFinances();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus transaksi.';
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
      key: 'tipe',
      label: 'Tipe',
      render: (row) => <StatusBadge status={row.tipe} />,
    },
    {
      key: 'kategori',
      label: 'Kategori',
      render: (row) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            backgroundColor: '#F1F5F9',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#475569',
            fontWeight: '500',
          }}
        >
          {row.kategori}
        </span>
      ),
    },
    {
      key: 'catatan',
      label: 'Keterangan',
      render: (row) => (
        <div style={{ maxWidth: '280px' }}>
          <p style={{ margin: 0, color: '#334155', fontSize: '13px' }}>
            {row.catatan || '-'}
          </p>
          {row.order_id && (
            <span style={{ fontSize: '11px', color: '#6366F1', fontWeight: '500' }}>
              Pesanan #{row.order_id}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'nominal',
      label: 'Nominal',
      align: 'right',
      render: (row) => {
        const isIncome = row.tipe === 'pemasukan';
        return (
          <span
            style={{
              fontWeight: '700',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: isIncome ? '#16A34A' : '#DC2626',
              whiteSpace: 'nowrap',
            }}
          >
            {isIncome ? '+ ' : '- '}
            {formatRupiah(row.nominal)}
          </span>
        );
      },
    },
    {
      key: 'user',
      label: 'Dicatat Oleh',
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
            onClick={() => handleOpenEdit(row)}
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
            title="Edit transaksi"
          >
            <Edit2 size={13} />
            <span>Edit</span>
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
              title="Hapus transaksi (Khusus Admin)"
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
            <Wallet size={24} color="#4F46E5" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Keuangan & Arus Kas
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Pencatatan kas masuk, biaya operasional toko, dan rekap saldo keuangan ({pagination.total} transaksi)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchFinances}
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

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
            }}
          >
            <Plus size={16} />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Total Pemasukan */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Total Pemasukan
            </span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#16A34A', marginTop: '2px' }}>
              {formatRupiah(summary.total_pemasukan)}
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}
          >
            <TrendingDown size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Total Pengeluaran
            </span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#DC2626', marginTop: '2px' }}>
              {formatRupiah(summary.total_pengeluaran)}
            </div>
          </div>
        </div>

        {/* Saldo / Laba Bersih */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F46E5',
            }}
          >
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Saldo Kas
            </span>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: summary.saldo >= 0 ? '#4F46E5' : '#DC2626',
                marginTop: '2px',
              }}
            >
              {formatRupiah(summary.saldo)}
            </div>
          </div>
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
              placeholder="Cari keterangan atau kategori..."
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
          <option value="pemasukan">Pemasukan</option>
          <option value="pengeluaran">Pengeluaran</option>
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

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={setPeriodToday}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={setPeriodThisMonth}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Bulan Ini
          </button>
        </div>

        {(search || typeFilter || categoryFilter || startDate || endDate) && (
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
            Reset Filter
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
            onClick={fetchFinances}
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
        data={transactions}
        loading={loading}
        emptyMessage="Belum ada transaksi keuangan yang tercatat."
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
            Menampilkan halaman {pagination.current_page} dari {pagination.last_page} (Total {pagination.total} data)
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

      {/* Modal Form Tambah / Edit Transaksi Keuangan */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={selectedTx ? 'Edit Catatan Transaksi' : 'Catat Transaksi Keuangan Baru'}
        maxWidth="500px"
        footer={
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setModalOpen(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              form="finance-form"
              disabled={submitting}
              style={{
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: '#4F46E5',
                color: '#FFFFFF',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
              }}
            >
              {submitting ? 'Menyimpan...' : selectedTx ? 'Simpan Perubahan' : 'Catat Transaksi'}
            </button>
          </>
        }
      >
        <form id="finance-form" onSubmit={handleSubmit}>
          {/* Tipe Transaksi (Pemasukan / Pengeluaran) */}
          <FormField label="Tipe Transaksi" required error={fieldErrors.tipe}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: formData.tipe === 'pemasukan' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                  backgroundColor: formData.tipe === 'pemasukan' ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: formData.tipe === 'pemasukan' ? '600' : '400',
                  color: formData.tipe === 'pemasukan' ? '#16A34A' : '#475569',
                }}
              >
                <input
                  type="radio"
                  name="tipe"
                  value="pemasukan"
                  checked={formData.tipe === 'pemasukan'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tipe: e.target.value }))}
                  style={{ accentColor: '#16A34A' }}
                />
                <span>Pemasukan (+)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: formData.tipe === 'pengeluaran' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                  backgroundColor: formData.tipe === 'pengeluaran' ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: formData.tipe === 'pengeluaran' ? '600' : '400',
                  color: formData.tipe === 'pengeluaran' ? '#DC2626' : '#475569',
                }}
              >
                <input
                  type="radio"
                  name="tipe"
                  value="pengeluaran"
                  checked={formData.tipe === 'pengeluaran'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tipe: e.target.value }))}
                  style={{ accentColor: '#DC2626' }}
                />
                <span>Pengeluaran (-)</span>
              </label>
            </div>
          </FormField>

          {/* Tanggal & Nominal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Tanggal" required error={fieldErrors.tanggal} htmlFor="tx-date">
              <input
                id="tx-date"
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData((prev) => ({ ...prev, tanggal: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: fieldErrors.tanggal ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </FormField>

            <FormField label="Nominal (Rp)" required error={fieldErrors.nominal} htmlFor="tx-amount">
              <input
                id="tx-amount"
                type="number"
                min="1"
                step="1"
                required
                placeholder="Contoh: 150000"
                value={formData.nominal}
                onChange={(e) => setFormData((prev) => ({ ...prev, nominal: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: fieldErrors.nominal ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </FormField>
          </div>

          {/* Kategori */}
          <FormField
            label="Kategori"
            required
            error={fieldErrors.kategori}
            htmlFor="tx-category"
            helper="Pilih dari daftar atau ketik kategori baru"
          >
            <input
              id="tx-category"
              type="text"
              required
              list="category-suggestions"
              placeholder={formData.tipe === 'pemasukan' ? 'Penjualan, Modal, Bonus...' : 'Bahan Baku, Listrik & Air, Gaji, Sewa, Operasional...'}
              value={formData.kategori}
              onChange={(e) => setFormData((prev) => ({ ...prev, kategori: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.kategori ? '1px solid #DC2626' : '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <datalist id="category-suggestions">
              {formData.tipe === 'pemasukan' ? (
                <>
                  <option value="Penjualan Produk" />
                  <option value="Penjualan Pesanan Khusus" />
                  <option value="Suntikan Modal" />
                  <option value="Pendapatan Lain-lain" />
                </>
              ) : (
                <>
                  <option value="Bahan Baku" />
                  <option value="Operasional Toko" />
                  <option value="Listrik, Gas & Air" />
                  <option value="Gaji Karyawan" />
                  <option value="Kemasan & Packaging" />
                  <option value="Perawatan Alat" />
                  <option value="Sewa Tempat" />
                  <option value="Lain-lain" />
                </>
              )}
            </datalist>
          </FormField>

          {/* Catatan */}
          <FormField label="Keterangan / Catatan (Opsional)" error={fieldErrors.catatan} htmlFor="tx-note">
            <textarea
              id="tx-note"
              rows={3}
              placeholder="Contoh: Pembelian tepung Cakra Kembar 5 karung dan mentega anchor..."
              value={formData.catatan}
              onChange={(e) => setFormData((prev) => ({ ...prev, catatan: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.catatan ? '1px solid #DC2626' : '1px solid #CBD5E1',
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

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Transaksi Keuangan"
        message={`Apakah Anda yakin ingin menghapus catatan transaksi ${txToDelete?.kategori} sebesar ${formatRupiah(txToDelete?.nominal)}? Data arus kas yang dihapus tidak dapat dipulihkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        loading={deleting}
      />
    </div>
  );
}
