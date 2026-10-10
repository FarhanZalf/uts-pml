import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Edit2, Trash2, Sliders, RefreshCw, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function ProdukPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const isAdmin = can('admin');

  // List states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Form modal states (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    category_id: '',
    kategori: '',
    harga: '',
    stok: 0,
    deskripsi: '',
    gambar: '',
    is_active: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Adjust stock modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [productForStock, setProductForStock] = useState(null);
  const [stockFormData, setStockFormData] = useState({ tipe: 'tambah', jumlah: 1, catatan: '' });
  const [stockSubmitting, setStockSubmitting] = useState(false);
  const [stockError, setStockError] = useState('');

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load categories for dropdown
  useEffect(() => {
    categoryService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.search = search.trim();
      if (selectedKategori) params.kategori = selectedKategori;
      if (statusFilter !== '') params.is_active = statusFilter === 'true';

      const response = await productService.getProducts(params);
      setProducts(response.data || []);
      if (response.meta) {
        setPagination({
          current_page: response.meta.current_page || 1,
          last_page: response.meta.last_page || 1,
          total: response.meta.total || 0,
        });
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat daftar produk.');
      showToast('Gagal memuat produk.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedKategori, statusFilter, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData({
      nama: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      kategori: categories.length > 0 ? categories[0].name : '',
      harga: '',
      stok: 0,
      deskripsi: '',
      gambar: '',
      is_active: true,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      nama: product.nama || '',
      category_id: product.category_id || '',
      kategori: product.kategori || '',
      harga: product.harga ?? '',
      stok: product.stok ?? 0,
      deskripsi: product.deskripsi || '',
      gambar: product.gambar || '',
      is_active: product.is_active ?? true,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const found = categories.find((c) => String(c.id) === String(catId));
    setFormData((prev) => ({
      ...prev,
      category_id: catId,
      kategori: found ? found.name : prev.kategori,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const payload = {
      ...formData,
      harga: parseFloat(formData.harga),
      stok: parseInt(formData.stok, 10) || 0,
    };

    try {
      if (selectedProduct) {
        await productService.updateProduct(selectedProduct.id, payload);
        showToast(`Produk "${formData.nama}" berhasil diperbarui.`, 'success');
      } else {
        await productService.createProduct(payload);
        showToast(`Produk "${formData.nama}" berhasil ditambahkan.`, 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        showToast(err.response.data.message || 'Validasi gagal.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Gagal menyimpan produk.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Adjust stock handler
  const handleOpenAdjustStock = (product) => {
    setProductForStock(product);
    setStockFormData({ tipe: 'tambah', jumlah: 5, catatan: '' });
    setStockError('');
    setStockModalOpen(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!productForStock) return;
    setStockSubmitting(true);
    setStockError('');

    try {
      const response = await productService.adjustStock(productForStock.id, {
        tipe: stockFormData.tipe,
        jumlah: parseInt(stockFormData.jumlah, 10),
        catatan: stockFormData.catatan,
      });
      showToast(response.message || 'Stok berhasil diperbarui.', 'success');
      setStockModalOpen(false);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyesuaikan stok.';
      setStockError(msg);
      showToast(msg, 'error');
    } finally {
      setStockSubmitting(false);
    }
  };

  // Delete product handler
  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const res = await productService.deleteProduct(productToDelete.id);
      showToast(res.message || `Produk "${productToDelete.nama}" berhasil diproses.`, 'success');
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus produk.', 'error');
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
      key: 'nama',
      label: 'Produk',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: '#0F172A' }}>{row.nama}</div>
          {row.deskripsi && (
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.deskripsi}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'kategori',
      label: 'Kategori',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#475569', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
          {row.kategori || row.category?.name || '-'}
        </span>
      ),
    },
    {
      key: 'harga',
      label: 'Harga',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#0F172A' }}>
          {formatRupiah(row.harga)}
        </span>
      ),
    },
    {
      key: 'stok',
      label: 'Stok',
      align: 'center',
      render: (row) => (
        <span
          style={{
            fontWeight: '700',
            color: row.stok <= 5 ? '#DC2626' : '#1E293B',
            backgroundColor: row.stok <= 5 ? '#FEF2F2' : 'transparent',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {row.stok}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      align: 'center',
      render: (row) => (
        <StatusBadge
          status={row.is_active ? 'active' : 'inactive'}
          label={row.is_active ? 'Aktif' : 'Nonaktif'}
        />
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
            onClick={() => handleOpenAdjustStock(row)}
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
            title="Penyesuaian Stok Cepat"
          >
            <Sliders size={13} />
            <span>Stok</span>
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
              title="Aksi khusus Admin (soft-deactivate bila ada riwayat pesanan)"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Package size={24} color="#4F46E5" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Katalog Produk
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Manajemen menu bakery, harga, dan ketersediaan stok ({pagination.total} produk)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchProducts}
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
            <span>Tambah Produk</span>
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: '1', minWidth: '220px', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Cari nama atau deskripsi..."
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
          value={selectedKategori}
          onChange={(e) => {
            setSelectedKategori(e.target.value);
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
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

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
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
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
            onClick={fetchProducts}
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
        data={products}
        loading={loading}
        emptyMessage="Tidak ada produk ditemukan sesuai filter pencarian."
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
            Menampilkan halaman {pagination.current_page} dari {pagination.last_page} (Total {pagination.total} produk)
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

      {/* Modal Form Tambah / Edit Produk */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={selectedProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
        maxWidth="540px"
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
              form="product-form"
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
              {submitting ? 'Menyimpan...' : selectedProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit}>
          <FormField label="Nama Produk" required error={fieldErrors.nama} htmlFor="p-name">
            <input
              id="p-name"
              type="text"
              required
              placeholder="Contoh: Roti Sisir Mentega"
              value={formData.nama}
              onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.nama ? '1px solid #DC2626' : '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Kategori" required error={fieldErrors.category_id || fieldErrors.kategori} htmlFor="p-cat">
              <select
                id="p-cat"
                value={formData.category_id}
                onChange={handleCategoryChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: (fieldErrors.category_id || fieldErrors.kategori) ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Harga Satuan (Rp)" required error={fieldErrors.harga} htmlFor="p-price">
              <input
                id="p-price"
                type="number"
                min="0"
                step="500"
                required
                placeholder="25000"
                value={formData.harga}
                onChange={(e) => setFormData((prev) => ({ ...prev, harga: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: fieldErrors.harga ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Stok Awal" error={fieldErrors.stok} htmlFor="p-stock">
              <input
                id="p-stock"
                type="number"
                min="0"
                value={formData.stok}
                onChange={(e) => setFormData((prev) => ({ ...prev, stok: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: fieldErrors.stok ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </FormField>

            <FormField label="Status Penjualan" htmlFor="p-status">
              <select
                id="p-status"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}
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
                <option value="true">Aktif (Dijual)</option>
                <option value="false">Nonaktif (Disembunyikan)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Deskripsi Produk (Opsional)" error={fieldErrors.deskripsi} htmlFor="p-desc">
            <textarea
              id="p-desc"
              rows={3}
              placeholder="Deskripsi bahan, tekstur, atau rasa roti..."
              value={formData.deskripsi}
              onChange={(e) => setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.deskripsi ? '1px solid #DC2626' : '1px solid #CBD5E1',
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

      {/* Modal Penyesuaian Stok (Adjust Stock) */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => !stockSubmitting && setStockModalOpen(false)}
        title={`Penyesuaian Stok: ${productForStock?.nama || ''}`}
        maxWidth="440px"
        footer={
          <>
            <button
              type="button"
              disabled={stockSubmitting}
              onClick={() => setStockModalOpen(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                cursor: stockSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              form="stock-form"
              disabled={stockSubmitting}
              style={{
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: '#4F46E5',
                color: '#FFFFFF',
                cursor: stockSubmitting ? 'not-allowed' : 'pointer',
                opacity: stockSubmitting ? 0.75 : 1,
              }}
            >
              {stockSubmitting ? 'Menyimpan...' : 'Perbarui Stok'}
            </button>
          </>
        }
      >
        <form id="stock-form" onSubmit={handleStockSubmit}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            <span style={{ color: '#64748B' }}>Stok saat ini: </span>
            <strong style={{ color: '#0F172A', fontSize: '15px' }}>{productForStock?.stok ?? 0} pcs</strong>
          </div>

          {stockError && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
              {stockError}
            </div>
          )}

          <FormField label="Jenis Penyesuaian" required htmlFor="stock-type">
            <select
              id="stock-type"
              value={stockFormData.tipe}
              onChange={(e) => setStockFormData((prev) => ({ ...prev, tipe: e.target.value }))}
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
              <option value="tambah">Tambah Stok (+)</option>
              <option value="kurang">Kurang Stok (-)</option>
              <option value="set">Set Nilai Stok Baru (=)</option>
            </select>
          </FormField>

          <FormField label="Jumlah Unit" required htmlFor="stock-qty">
            <input
              id="stock-qty"
              type="number"
              min="0"
              required
              value={stockFormData.jumlah}
              onChange={(e) => setStockFormData((prev) => ({ ...prev, jumlah: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </FormField>

          <FormField label="Catatan Penyesuaian (Opsional)" htmlFor="stock-note">
            <input
              id="stock-note"
              type="text"
              placeholder="Contoh: Produksi batch pagi, retur toko"
              value={stockFormData.catatan}
              onChange={(e) => setStockFormData((prev) => ({ ...prev, catatan: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </FormField>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus Produk */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.nama}"? Jika produk memiliki riwayat transaksi pesanan, sistem akan secara aman menonaktifkan statusnya.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        loading={deleting}
      />
    </div>
  );
}
