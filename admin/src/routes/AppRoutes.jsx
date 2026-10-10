import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import PesananPage from '../pages/PesananPage';
import ProdukPage from '../pages/ProdukPage';
import KategoriPage from '../pages/KategoriPage';
import PelangganPage from '../pages/PelangganPage';
import PembayaranPage from '../pages/PembayaranPage';
import KeuanganPage from '../pages/KeuanganPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pesanan" element={<PesananPage />} />
          <Route path="/produk" element={<ProdukPage />} />
          <Route path="/kategori" element={<KategoriPage />} />
          <Route path="/pelanggan" element={<PelangganPage />} />
          <Route path="/pembayaran" element={<PembayaranPage />} />
          <Route path="/keuangan" element={<KeuanganPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
