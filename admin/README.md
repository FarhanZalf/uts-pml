# Erles Bakery ERP — Panel Admin (React + Vite)

Aplikasi Web Panel Administrasi dan ERP untuk **Erles Bakery**. Dibangun menggunakan **React 18**, **Vite**, **React Router v6**, **Axios**, dan styling **Vanilla CSS** yang responsif dan clean.

---

## 🚀 Panduan Menjalankan

### 1. Menjalankan Secara Lokal (Host Machine)

Pastikan telah menginstal **Node.js** (v18+ atau v20+) dan **npm**.

1. Masuk ke direktori `admin`:
   ```bash
   cd admin
   ```

2. Salin environment file:
   ```bash
   cp .env.example .env
   ```

3. Instal dependensi:
   ```bash
   npm install
   ```

4. Jalankan development server:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5174` (atau `http://localhost:5173` jika port 5174 digunakan).

5. Untuk build production bundle:
   ```bash
   npm run build
   ```

---

### 2. Menjalankan via Docker Compose

Dari direktori root proyek (`erles-bakery-erp`):

1. Jalankan seluruh layanan (Database, Backend Laravel, Admin, Public):
   ```bash
   docker compose up -d
   ```

2. Atau jalankan khusus container admin:
   ```bash
   docker compose up -d --build admin
   ```

3. Periksa status container:
   ```bash
   docker compose ps
   ```

4. Buka aplikasi admin di browser:
   ```
   http://localhost:5174
   ```

---

## ⚙️ Daftar Environment Variables

File konfigurasi berada di `.env` (berdasarkan `.env.example`):

| Variabel | Default | Keterangan |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8000/api` | Base URL endpoint API Laravel backend |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Fallback URL root backend |

> **Catatan**: Axios client (`src/services/api.js`) secara otomatis memprioritaskan `VITE_API_URL`, lalu `VITE_API_BASE_URL/api`, dan fallback ke `http://localhost:8000/api`.

---

## 🔐 Akun Default untuk Login

Gunakan akun seed default berikut untuk masuk:

- **Admin (Akses Penuh CRUD & Hapus)**:
  - Email: `admin@erlesbakery.com`
  - Password: `password`
- **Staff (Akses Operasional tanpa Hapus Data Permanen)**:
  - Email: `staff@erlesbakery.com`
  - Password: `password`

---

## 📂 Struktur Modul & Fitur

1. **Dashboard (`/`)**:
   - Kartu metrik: Omzet/Pemasukan bulan ini, Pengeluaran bulan ini, Laba bersih, Aktivitas pesanan, Total produk & pelanggan.
   - Grafik tren arus kas 7 hari terakhir (Pemasukan vs Pengeluaran).
   - 5 Pesanan terbaru & 5 Produk terlaris.
2. **Pesanan (`/pesanan`)**:
   - Filter status pesanan (Semua, Menunggu, Diproses, Siap, Selesai, Dibatalkan), pencarian nomor pesanan/pelanggan.
   - Rincian pesanan (item produk, subtotal, catatan, alamat/metode kirim).
   - Update status operasional, batalkan pesanan, dan rekam pembayaran pesanan.
   - Hapus pesanan (khusus Admin).
3. **Produk (`/produk`)**:
   - Katalog menu bakery, harga satuan, kategori, status aktif.
   - Modal tambah/edit produk dengan validasi form (422 error display).
   - Penyesuaian stok (tambah/kurang) dengan catatan mutasi.
   - Hapus produk (khusus Admin).
4. **Kategori (`/kategori`)**:
   - Master kategori produk bakery (nama, slug, deskripsi).
   - Tambah/edit dan hapus (khusus Admin).
5. **Pelanggan (`/pelanggan`)**:
   - Database pelanggan (nama, nomor telepon/WhatsApp, email, alamat, catatan).
   - Modal tambah/edit pelanggan, modal rincian pelanggan, dan hapus pelanggan.
6. **Pembayaran (`/pembayaran`)**:
   - Rekapitulasi global transaksi pembayaran pesanan.
   - Filter berdasarkan metode pembayaran (Transfer, Tunai, QRIS) dan tipe (DP, Pelunasan, Penuh).
   - Modal rincian pembayaran dan bukti transfer.
   - Hapus pembayaran (khusus Admin).
7. **Keuangan (`/keuangan`)**:
   - Ringkasan arus kas (Total Pemasukan, Total Pengeluaran, Saldo Kas).
   - Filter tipe transaksi dan rentang periode tanggal (dengan tombol cepat: *Hari Ini* & *Bulan Ini*).
   - Modal pencatatan transaksi kas (Pemasukan & Pengeluaran) beserta kategori dan catatan.
   - Hapus transaksi kas (khusus Admin).

---

## 📱 Responsivitas & UI

- Mendukung tampilan Desktop, Tablet, dan Ponsel pintar (Mobile).
- Dilengkapi dengan *hamburger menu drawer* pada resolusi layar $\le 768px$.
- Notifikasi sistem menggunakan **Toast** yang seragam dan informatif.
- Konfirmasi penghapusan data menggunakan **ConfirmDialog**.
