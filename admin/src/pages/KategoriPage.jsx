import { useState, useEffect, useCallback } from 'react';
import { Tags, Plus, Edit2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import categoryService from '../services/categoryService';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import FormField from '../components/common/FormField';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function KategoriPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const isAdmin = can('admin');

  // List states
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat daftar kategori.');
      showToast('Gagal memuat daftar kategori.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: '', slug: '', description: '' });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    try {
      if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, formData);
        showToast(`Kategori "${formData.name}" berhasil diperbarui.`, 'success');
      } else {
        await categoryService.createCategory(formData);
        showToast(`Kategori "${formData.name}" berhasil ditambahkan.`, 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        showToast(err.response.data.message || 'Validasi gagal.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Gagal menyimpan kategori.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      showToast(`Kategori "${categoryToDelete.name}" berhasil dihapus.`, 'success');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus kategori.';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama Kategori',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: '#0F172A' }}>{row.name}</div>
          {row.description && (
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (row) => (
        <code style={{ fontSize: '12px', color: '#6366F1', backgroundColor: '#EEF2FF', padding: '2px 6px', borderRadius: '4px' }}>
          {row.slug}
        </code>
      ),
    },
    {
      key: 'products_count',
      label: 'Jumlah Produk',
      align: 'center',
      render: (row) => (
        <span style={{ fontWeight: '600', color: '#334155' }}>
          {row.products_count ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            style={{
              padding: '6px 10px',
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
                padding: '6px 10px',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Tags size={24} color="#4F46E5" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Kategori Produk
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Master kategori pengelompokan produk bakery ({categories.length} kategori)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchCategories}
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
            title="Muat ulang data"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
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
            <span>Tambah Kategori</span>
          </button>
        </div>
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
            onClick={fetchCategories}
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
        data={categories}
        loading={loading}
        emptyMessage="Belum ada kategori yang dibuat. Klik 'Tambah Kategori' untuk membuat baru."
      />

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={selectedCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Baru'}
        maxWidth="480px"
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
              form="category-form"
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
              {submitting ? 'Menyimpan...' : selectedCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit}>
          <FormField
            label="Nama Kategori"
            required
            error={fieldErrors.name}
            htmlFor="cat-name"
          >
            <input
              id="cat-name"
              type="text"
              required
              placeholder="Contoh: Roti Manis, Pastry, Kue Kering"
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

          <FormField
            label="Slug (Opsional)"
            error={fieldErrors.slug}
            helper="Dibuat otomatis dari nama jika dikosongkan."
            htmlFor="cat-slug"
          >
            <input
              id="cat-slug"
              type="text"
              placeholder="contoh: roti-manis"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.slug ? '1px solid #DC2626' : '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </FormField>

          <FormField
            label="Deskripsi (Opsional)"
            error={fieldErrors.description}
            htmlFor="cat-desc"
          >
            <textarea
              id="cat-desc"
              rows={3}
              placeholder="Keterangan singkat kategori..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: fieldErrors.description ? '1px solid #DC2626' : '1px solid #CBD5E1',
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
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        loading={deleting}
      />
    </div>
  );
}
