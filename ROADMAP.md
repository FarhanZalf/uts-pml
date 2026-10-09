# ROADMAP PENGEMBANGAN APLIKASI
## Erles Bakery Publik (Android Mobile App)

Dokumen ini adalah panduan alur kerja pengembangan dan pelacak progres (*progress tracker*).
> **PENTING UNTUK DEVELOPER / AI AGENT:**  
> Jika memulai sesi baru setelah jeda atau restart, selalu baca dokumen ini dan `FITUR_UTS.md` terlebih dahulu untuk mengetahui titik terakhir pengerjaan tanpa perlu meminta penjelasan ulang dari pengguna.

---

### Tahapan Pengembangan (Roadmap)

#### 📌 FASE 1: Desain & Alur Antarmuka (UI Prototype & Mock Data)
> **Fokus Utama Saat Ini**: Membangun seluruh tampilan dan komponen UI penilaian dosen dengan mock/dummy data sebelum integrasi ke backend API, agar tim frontend dan backend tidak saling menunggu.

- [ ] **Langkah 1.1**: Aktivasi ViewBinding di `app/build.gradle.kts` secara aman (bedah mikro tanpa merusak library lain) & verifikasi build hijau.
- [ ] **Langkah 1.2**: Struktur Paket & Model Data Dummy (`Product`, `Category`, `CartItem`, `Order`).
- [ ] **Langkah 1.3**: Layout Utama (`MainActivity` + `BottomNavigationView` + `FrameLayout`):
  - Tab 1: Menu Katalog
  - Tab 2: Keranjang Belanja
  - Tab 3: Riwayat / Lacak Pesanan
- [ ] **Langkah 1.4**: Tab Menu Katalog:
  - `AutoCompleteTextView` (Pencarian produk)
  - `Spinner` (Pilihan kategori produk)
  - `ListView` + Custom Adapter (Daftar kartu produk: gambar, nama, harga Rp, stok)
  - `PopupMenu` (Sortir harga termurah/termahal)
- [ ] **Langkah 1.5**: Detail Produk (`ProductDetailActivity`):
  - Gambar produk, deskripsi lengkap, stok, harga
  - Selector jumlah (Quantity +/-)
  - Tombol "Tambah ke Keranjang"
- [ ] **Langkah 1.6**: Tab Keranjang Belanja (`CartFragment`):
  - Daftar produk di keranjang (SQLite Database `cart_items`)
  - Ubah kuantitas & hapus item
  - `ContextMenu` (Aksi cepat: Hapus / Tambah catatan)
  - Ringkasan total harga & Tombol "Lanjut ke Checkout"
- [ ] **Langkah 1.7**: Layar Checkout (`CheckoutActivity`):
  - `EditText`: Nama lengkap, Nomor WhatsApp/Telepon, Alamat lengkap
  - `RadioButton`: Pilihan pengiriman (Ambil Sendiri di Toko / Diantar Kurir)
  - `DatePickerDialog`: Pemilihan tanggal pengambilan
  - `TimePickerDialog`: Pemilihan jam pengambilan
  - `CheckBox`: Opsi tambahan (Tambahkan Kartu Ucapan, Tambahkan Lilin Ulang Tahun)
  - `EditText`: Catatan khusus pesanan
  - Validasi formulir lengkap & Tombol "Konfirmasi Pesanan"
- [ ] **Langkah 1.8**: Layar Berhasil Pesan (`SuccessOrderActivity`):
  - Menampilkan ringkasan pesanan & kode pesanan untuk lacak

---

#### 📌 FASE 2: Fitur Lanjutan (Kamera, Galeri, Supabase, GPS/Maps, QR Code)
- [ ] Integrasi Kamera & Galeri (Upload foto custom cake/bukti)
- [ ] Upload file ke Supabase Storage
- [ ] Integrasi GPS & Google Maps / OpenStreetMaps (Penunjuk lokasi toko & pengantaran)
- [ ] Generator & Scanner QR Code untuk tiket pengambilan pesanan

---

#### 📌 FASE 3: Integrasi API Laravel (Volley) & Cloud Messaging (FCM)
- [ ] Penambahan pustaka Volley & ApiClient
- [ ] Penggantian mock data ke endpoint Laravel API (`GET /categories`, `GET /products`, `POST /orders`, `GET /orders/track/{code}`)
- [ ] Firebase Cloud Messaging (FCM) untuk notifikasi status pesanan
- [ ] Firebase In-App Messaging untuk banner promo
- [ ] Pengujian menyeluruh (*End-to-End Test*) & Penyusunan Laporan UTS

---

### Status Pengerjaan Terkini (Current State)
* **Tanggal Update**: 2026-10-09
* **Fase Aktif**: **FASE 1 (Desain & Alur Antarmuka UI)**
* **Langkah Berikutnya yang Siap Dikerjakan**:
  - Langkah 1.1: Menambahkan `buildFeatures { viewBinding = true }` ke `app/build.gradle.kts` dengan validasi build agar aman.
  - Memulai pembuatan model data dan layout utama dengan BottomNavigationView.
