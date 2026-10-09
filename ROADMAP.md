# ROADMAP PENGEMBANGAN APLIKASI
## Erles Bakery Publik (Android Mobile App)

Dokumen ini adalah panduan alur kerja pengembangan dan pelacak progres (*progress tracker*).
> **PENTING UNTUK DEVELOPER / AI AGENT:**  
> Jika memulai sesi baru setelah jeda atau restart, selalu baca dokumen ini dan `FITUR_UTS.md` terlebih dahulu untuk mengetahui titik terakhir pengerjaan tanpa perlu meminta penjelasan ulang dari pengguna.

---

### Tahapan Pengembangan (Roadmap)

#### 📌 FASE 1: Desain & Alur Antarmuka (UI Prototype & Mock Data)
> **Fokus Utama Saat Ini**: Membangun seluruh tampilan dan komponen UI penilaian dosen dengan mock/dummy data sebelum integrasi ke backend API, agar tim frontend dan backend tidak saling menunggu.

- [x] **Langkah 1.1**: Aktivasi ViewBinding di `app/build.gradle.kts` secara aman & verifikasi build hijau (SELESAI - BUILD SUCCESSFUL).
- [x] **Langkah 1.2**: Struktur Paket & Model Data Dummy (`Product`, `Category`, `CartItem`, `DummyData`) (SELESAI).
- [x] **Langkah 1.3**: Layout Utama (`MainActivity` + `BottomNavigationView` + `FrameLayout` + Badge Keranjang Real-time) (SELESAI).
- [x] **Langkah 1.4**: Tab Menu Katalog (SELESAI):
  - `AutoCompleteTextView` (Pencarian produk)
  - `Spinner` (Pilihan kategori produk)
  - `ListView` + Custom Adapter (Daftar kartu produk: gambar, nama, harga Rp, stok)
  - `PopupMenu` (Sortir harga termurah/termahal)
  - Pop-up BottomSheet Detail Produk (Stepper quantity & langsung masukkan keranjang)
- [x] **Langkah 1.6**: Tab Keranjang Belanja (`CartFragment`) (SELESAI):
  - Daftar produk di keranjang (SQLite Database `cart_items`)
  - Stepper ubah kuantitas & hapus item
  - `ContextMenu` (Aksi cepat: Hapus / Tambah catatan roti)
  - Ringkasan total harga & Tombol "Lanjut ke Checkout"
  - Sinkronisasi Badge notifikasi angka pada navigasi bawah
- [x] **Langkah 1.7**: Layar Checkout (`CheckoutActivity`) (SELESAI):
  - `EditText`: Nama lengkap, Nomor WhatsApp/Telepon, Alamat lengkap, Catatan pesanan
  - `SharedPreferences`: Menyimpan Nama & Nomor HP otomatis agar tidak perlu ketik ulang
  - `RadioButton`: Pilihan pengiriman (Ambil Sendiri di Toko / Diantar Kurir)
  - `DatePickerDialog`: Pemilihan tanggal pengambilan
  - `TimePickerDialog`: Pemilihan jam pengambilan
  - `CheckBox`: Opsi tambahan (Tambahkan Kartu Ucapan, Tambahkan Lilin Ulang Tahun)
  - Penyimpanan ke database SQLite lokal (`orders_history`) dengan format kanonikal `ORD-{YYYYMMDD}-{XXXX}`
- [x] **Langkah 1.8**: Tab 3 Lacak & Riwayat Pesanan (`TrackingFragment`) & OptionsMenu (SELESAI):
  - Form pencarian kode pesanan (`EditText` + `Button` Lacak) & tombol cepat pesanan terakhir
  - Visual status stepper: Pending ➔ Diproses ➔ Siap Diambil ➔ Selesai
  - Tombol demo ubah status pesanan secara dinamis
  - Generator **QR-Code** tiket pengambilan kasir (ZXing Core)
  - Daftar riwayat seluruh pesanan dari SQLite `orders_history`
  - Tombol WhatsApp Customer Service / Kasir (Implicit Intent)
  - `OptionsMenu` di Toolbar utama (Tentang Toko, Panduan, Hubungi WA, Refresh)

---

#### 📌 ANTREAN REVISI LANJUTAN (BACKLOG ENHANCEMENT)
> **PENTING**: Bagian ini mencatat usulan fitur tambahan hasil diskusi yang akan ditinjau kembali setelah alur dasar aplikasi selesai:
- [ ] **Fitur Login & Register Akun Pelanggan (Authentication)**:
  - **Status**: Disimpan sebagai revisi lanjutan.
  - **Catatan**: Saat ini alur menggunakan *Guest Checkout* (nama & nomor WhatsApp disimpan via `SharedPreferences`) agar tidak terhambat oleh database backend teman. Begitu teman selesai merapikan backend/database dan menyediakan endpoint Auth (atau jika ingin mengaktifkan poin Firebase Auth 6%), fitur login/register akan dipasang sebelum checkout.

---

#### 📌 FASE 2: Fitur Lanjutan (Kamera, Galeri, Supabase, GPS/Maps, QR Code Scanner)
- [ ] Integrasi Kamera & Galeri (Upload foto custom cake/bukti)
- [ ] Upload file ke Supabase Storage
- [ ] Integrasi GPS & Google Maps / OpenStreetMaps (Penunjuk lokasi toko & pengantaran)
- [ ] Scanner QR Code untuk scan tiket pesanan
 
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
* **Fase Aktif**: **FASE 1 SELESAI (100% UI Prototype, Local SQLite, Navigation, dan Flow Pesan)**
* **Langkah Berikutnya yang Siap Dikerjakan**:
  - FASE 2: Integrasi GPS & Maps (Lokasi Toko & Rute) atau Kamera/Galeri untuk Foto Custom Cake.

