import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, RefreshCw, Search, AlertCircle, ChevronLeft, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import useToast from '../hooks/useToast';
import customerService from '../services/customerService';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';

export default function PelangganPage() {
  const { showToast } = useToast();

  // List states
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filter states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form modal states (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.search = search.trim();

      const response = await customerService.getCustomers(params);
      setCustomers(response.data || []);
      if (response.meta) {
        setPagination({
          current_page: response.meta.current_page || 1,
          last_page: response.meta.last_page || 1,
          total: response.meta.total || 0,
        });
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat data pelanggan.');
      showToast('Gagal memuat data pelanggan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleOpenDetail = async (customer) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    setCustomerDetail(null);
    try {
      const res = await customerService.getCustomer(customer.id);
      setCustomerDetail(res.data);
    } catch {
      showToast('Gagal memuat rincian pelanggan.', 'error');
      setDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
        showToast(`Data pelanggan "${formData.name}" berhasil diperbarui.`, 'success');
      } else {
        await customerService.createCustomer(formData);
        showToast(`Pelanggan "${formData.name}" berhasil ditambahkan.`, 'success');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        showToast(err.response.data.message || 'Validasi gagal.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Gagal menyimpan data pelanggan.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      await customerService.deleteCustomer(customerToDelete.id);
      showToast(`Pelanggan "${customerToDelete.name}" berhasil dihapus.`, 'success');
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus pelanggan.', 'error');
    } finally {
      setDeleting(false);
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

  const columns = [
    {
      key: 'name',
      label: 'Nama Pelanggan',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: '#0F172A' }}>{row.name}</div>
          {row.notes && (
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              {row.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Kontak',
      render: (row) => (
        <div style={{ fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1E293B' }}>
            <Phone size={13} color="#6366F1" />
            <span>{row.phone}</span>
          </div>
          {row.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
              <Mail size={12} />
              <span>{row.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Alamat',
      render: (row) => (
        <div style={{ fontSize: '13px', color: '#475569', maxWidth: '240px' }}>
          {row.address || '-'}
        </div>
      ),
    },
    {
      key: 'total_orders',
      label: 'Pesanan',
      align: 'center',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#334155' }}>
          {row.total_orders ?? 0}x
        </span>
      ),
    },
    {
      key: 'total_spent',
      label: 'Total Belanja',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#0F172A' }}>
          {formatRupiah(row.total_spent)}
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
            title="Lihat Riwayat Pesanan"
          >
            <Eye size={13} />
            <span>Rincian</span>
          </button>
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
          >
            <Edit2 size={13} />
            <span>Edit</span>
          </button>
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
          >
            <Trash2 size={13} />
            <span>Hapus</span>
          </button>
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
            <Users size={24} color="#4F46E5" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Data Pelanggan
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Database kontak dan histori transaksi pelanggan ({pagination.total} orang)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchCustomers}
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
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          padding: '14px 16px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: '1', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Cari nama, nomor WhatsApp/telepon, atau email..."
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
            onClick={fetchCustomers}
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
        data={customers}
        loading={loading}
        emptyMessage="Belum ada data pelanggan yang cocok dengan pencarian."
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
            Menampilkan halaman {pagination.current_page} dari {pagination.last_page} (Total {pagination.total} orang)
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

      {/* Modal Tambah / Edit Pelanggan */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={selectedCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
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
              form="customer-form"
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
              {submitting ? 'Menyimpan...' : selectedCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit}>
          <FormField label="Nama Lengkap" required error={fieldErrors.name} htmlFor="c-name">
            <input
              id="c-name"
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.name ? '1px solid #DC2626' : '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="No. WhatsApp / Telepon" required error={fieldErrors.phone} htmlFor="c-phone">
              <input
                id="c-phone"
                type="text"
                required
                placeholder="081234567890"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: fieldErrors.phone ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </FormField>

            <FormField label="Email (Opsional)" error={fieldErrors.email} htmlFor="c-email">
              <input
                id="c-email"
                type="email"
                placeholder="pelanggan@mail.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: fieldErrors.email ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </FormField>
          </div>

          <FormField label="Alamat Pengiriman (Opsional)" error={fieldErrors.address} htmlFor="c-addr">
            <textarea
              id="c-addr"
              rows={2}
              placeholder="Alamat lengkap tujuan antar..."
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.address ? '1px solid #DC2626' : '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </FormField>

          <FormField label="Catatan Pelanggan (Opsional)" error={fieldErrors.notes} htmlFor="c-notes">
            <input
              id="c-notes"
              type="text"
              placeholder="Contoh: Langganan kantor, alergi kacang"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.notes ? '1px solid #DC2626' : '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </FormField>
        </form>
      </Modal>

      {/* Modal Detail Pelanggan & Riwayat Pesanan */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Rincian Profil Pelanggan"
        maxWidth="600px"
        footer={
          <button
            type="button"
            onClick={() => setDetailModalOpen(false)}
            style={{
              padding: '8px 16px',
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
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }} />
            <div>Memuat profil pelanggan...</div>
          </div>
        ) : customerDetail ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                  {customerDetail.name}
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: '#64748B' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} /> {customerDetail.phone}
                  </span>
                  {customerDetail.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={13} /> {customerDetail.email}
                    </span>
                  )}
                </div>
                {customerDetail.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '6px', fontSize: '13px', color: '#475569' }}>
                    <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{customerDetail.address}</span>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Total Transaksi</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                  {formatRupiah(customerDetail.total_spent)}
                </div>
                <div style={{ fontSize: '12px', color: '#4F46E5', fontWeight: '600' }}>
                  {customerDetail.total_orders ?? 0}x pesanan
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '10px' }}>
              Riwayat Pesanan
            </h4>

            {customerDetail.orders && customerDetail.orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {customerDetail.orders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A' }}>{ord.kode_pesanan}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {ord.tanggal_ambil ? `Pengambilan: ${ord.tanggal_ambil}` : 'Tanggal pesan: ' + (ord.created_at?.split('T')[0] || '-')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StatusBadge status={ord.status} size="sm" />
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>{formatRupiah(ord.total_price)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                Belum ada riwayat pesanan tercatat untuk pelanggan ini.
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Data Pelanggan"
        message={`Apakah Anda yakin ingin menghapus data pelanggan "${customerToDelete?.name}"?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        loading={deleting}
      />
    </div>
  );
}
