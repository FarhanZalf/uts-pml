import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  Package,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import dashboardService from '../services/dashboardService';
import StatusBadge from '../components/common/StatusBadge';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardService.getDashboard();
      setDashboardData(response.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memuat statistik dashboard.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatRupiah = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const ringkasan = dashboardData?.ringkasan || {};
  const trendHarian = dashboardData?.trend_harian || [];
  const pesananTerbaru = dashboardData?.pesanan_terbaru || [];
  const produkTerlaris = dashboardData?.produk_terlaris || [];

  // Calculate max amount for SVG / Bar chart scaling
  const maxTrendAmount = Math.max(
    ...trendHarian.map((d) => Math.max(Number(d.pemasukan || 0), Number(d.pengeluaran || 0))),
    100000 // default minimum scale
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <LayoutDashboard size={24} color="#4F46E5" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Dashboard Ringkasan
            </h1>
            <StatusBadge status={user?.role} />
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Selamat datang kembali, <strong>{user?.name}</strong>. Berikut rekap operasional dan performa Erles Bakery.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
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
          title="Segarkan data dashboard"
        >
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="#DC2626" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
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

      {/* 1. Ringkasan Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Omzet / Pemasukan Bulan Ini */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Pemasukan Bulan Ini
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#16A34A' }}>
              {loading ? '...' : formatRupiah(ringkasan.pemasukan_bulan_ini)}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              Total All-Time: {loading ? '...' : formatRupiah(ringkasan.total_pemasukan)}
            </div>
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Pengeluaran Bulan Ini
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#DC2626' }}>
              {loading ? '...' : formatRupiah(ringkasan.pengeluaran_bulan_ini)}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              Total All-Time: {loading ? '...' : formatRupiah(ringkasan.total_pengeluaran)}
            </div>
          </div>
        </div>

        {/* Laba / Saldo Bersih */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Laba Bersih Bulan Ini
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: (ringkasan.laba_bulan_ini ?? 0) >= 0 ? '#4F46E5' : '#DC2626',
              }}
            >
              {loading ? '...' : formatRupiah(ringkasan.laba_bulan_ini)}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              Saldo Kas Total: {loading ? '...' : formatRupiah(ringkasan.saldo)}
            </div>
          </div>
        </div>

        {/* Pesanan */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Aktivitas Pesanan
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A' }}>
              {loading ? '...' : `${ringkasan.total_orders ?? 0} Pesanan`}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#2563EB', fontWeight: '500' }}>
                {ringkasan.active_orders ?? 0} Aktif
              </span>
              <span>•</span>
              <span style={{ color: '#16A34A', fontWeight: '500' }}>
                {ringkasan.completed_orders ?? 0} Selesai
              </span>
            </div>
          </div>
        </div>

        {/* Master Data (Katalog & Pelanggan) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Katalog & Database
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>
              {loading ? '...' : `${ringkasan.total_products ?? 0} Produk`}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              {loading ? '...' : `${ringkasan.total_customers ?? 0} Pelanggan Terdaftar`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chart Sederhana (Murni dari response /dashboard - trend_harian 7 hari) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#4F46E5" />
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: 0 }}>
                Tren Arus Kas 7 Hari Terakhir
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
              Perbandingan harian antara kas masuk (pemasukan) dan operasional (pengeluaran)
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: '#16A34A',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#475569', fontWeight: '500' }}>Pemasukan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: '#DC2626',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#475569', fontWeight: '500' }}>Pengeluaran</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        {trendHarian.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#94A3B8', fontSize: '14px' }}>
            Belum ada histori transaksi dalam 7 hari terakhir.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${trendHarian.length}, 1fr)`,
              gap: '12px',
              alignItems: 'flex-end',
              height: '220px',
              paddingTop: '20px',
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            {trendHarian.map((day, idx) => {
              const incomeHeight = Math.max(8, Math.round(((Number(day.pemasukan) || 0) / maxTrendAmount) * 160));
              const expenseHeight = Math.max(8, Math.round(((Number(day.pengeluaran) || 0) / maxTrendAmount) * 160));

              return (
                <div
                  key={day.tanggal || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                  title={`${day.hari}, ${day.tanggal}\nPemasukan: ${formatRupiah(day.pemasukan)}\nPengeluaran: ${formatRupiah(day.pengeluaran)}\nLaba: ${formatRupiah(day.laba)}`}
                >
                  {/* Bars Container */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                    {/* Income Bar */}
                    <div
                      style={{
                        width: '40%',
                        maxWidth: '28px',
                        height: `${day.pemasukan > 0 ? incomeHeight : 4}px`,
                        backgroundColor: day.pemasukan > 0 ? '#16A34A' : '#E2E8F0',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{
                        width: '40%',
                        maxWidth: '28px',
                        height: `${day.pengeluaran > 0 ? expenseHeight : 4}px`,
                        backgroundColor: day.pengeluaran > 0 ? '#DC2626' : '#E2E8F0',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Day Label */}
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B' }}>
                      {day.hari?.substring(0, 3) || day.tanggal?.substring(5)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {day.tanggal?.substring(8, 10)}/{day.tanggal?.substring(5, 7)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Lower Two-Column Section: Pesanan Terbaru & Produk Terlaris */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Pesanan Terbaru */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="#4F46E5" />
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A', margin: 0 }}>
                Pesanan Terbaru
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pesanan')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4F46E5',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>

          {pesananTerbaru.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: '13px' }}>
              Belum ada pesanan masuk.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pesananTerbaru.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate('/pesanan')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                      {order.kode_pesanan}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      {order.customer_name || 'Pelanggan'} • {order.items?.length || 0} item
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                      {formatRupiah(order.total_price)}
                    </div>
                    <div style={{ marginTop: '3px' }}>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5 Produk Terlaris */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#F59E0B" />
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A', margin: 0 }}>
                Produk Terlaris
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/produk')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4F46E5',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Katalog <ArrowRight size={14} />
            </button>
          </div>

          {produkTerlaris.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: '13px' }}>
              Belum ada data penjualan produk.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {produkTerlaris.map((item, idx) => (
                <div
                  key={item.product_id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? '#FEF3C7' : '#E2E8F0',
                        color: idx === 0 ? '#D97706' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                        {item.product_name || `Produk #${item.product_id}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {item.total_terjual} porsi / box terjual
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#16A34A' }}>
                      {formatRupiah(item.total_omzet)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Total Omzet
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
