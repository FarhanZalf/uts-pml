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
- [x] **Langkah 1.8**: Tab 3 Lacak & Riwayat Pesanan (`TrackingFragment`) & OptionsMenu (SELESAI - REFINING UX):
  - **Otomatis Muat Pesanan Aktif**: Pelanggan langsung melihat pesanan berjalan tanpa perlu mengetik ulang kode pesanan.
  - **Diferensiasi Alur Pickup vs Delivery**:
    - **Ambil di Toko (Pickup)**: Tahap "Siap Diambil di Outlet" + **QR-Code Tiket Kasir** resmi.
    - **Diantar Kurir (Delivery)**: Tahap "Kurir Sedang Menuju Alamat" + rute & info alamat rumah + kontak kurir WA (QR-Code kasir disembunyikan).
  - **Panel Simulasi Dosen**: Tombol ubah status dibungkus khusus dalam panel `[Mode Pengujian Dosen: Simulasi Kasir]` agar terpisah jelas dari fitur customer.
  - Form pencarian kode pesanan sekunder (opsional jika ingin mengecek nomor nota lain).
  - Daftar riwayat seluruh pesanan dari SQLite `orders_history`.
  - `OptionsMenu` di Toolbar utama (Tentang Toko, Panduan, Hubungi WA, Refresh).

---

#### 📌 KEBIJAKAN PENGEMBANGAN & LOG DEPENDENSI GRADLE
> **Aturan Wajib:**
> 1. **Konfirmasi Dependensi**: Setiap penambahan pustaka/library di `app/build.gradle.kts` **WAJIB dikonfirmasikan kepada pengguna terlebih dahulu** sebelum dipasang.
> 2. **Komentar Penjelasan**: Setiap baris dependensi di `build.gradle.kts` wajib memiliki komentar fungsi & nomor poin UTS di atasnya.
> 3. **Kebijakan Git Push**: Hanya kode yang sudah tuntas (fix), lolos uji kompilasi lokal (`BUILD SUCCESSFUL`), dan berfungsi logikanya yang di-push ke remote branch `farhan-ganteng`.

#### 📦 Daftar Dependensi Tambahan di Gradle (`app/build.gradle.kts`):
| Nama Dependensi | Versi | Poin UTS | Fungsi & Manfaat untuk Aplikasi |
|---|:---:|:---:|---|
| `com.google.zxing:core` | `3.5.3` | #25 QR-Code (2%) | **Generator QR Code offline** untuk tiket pengambilan pesanan roti di kasir toko saat mode Pickup. Bekerja tanpa internet dan tidak membebani server. |
| `org.osmdroid:osmdroid-android` | `6.1.18` | #22 Maps/OSM (2%) | **Peta Interaktif OpenStreetMap (OSM)** untuk memilih titik alamat pengantaran di Checkout serta menampilkan petunjuk arah ke Outlet Bakery & rute navigasi kurir di Tracking. **100% Gratis tanpa API Key / tanpa Google Billing**. |

---

#### 📌 FASE 2: Fitur Lokasi, Peta, & Hardware (GPS & OSM)
- [x] **Integrasi GPS Otomatis (Bobot 2% - SELESAI)**:
  - Menggunakan bawaan Android SDK (`LocationManager` + `Geocoder`), **tanpa menambah library Gradle**.
  - Deteksi koordinat latitude/longitude pelanggan saat checkout pengantaran dan otomatis mengisi teks alamat rumah.
- [x] **Integrasi OpenStreetMap / OSM (Bobot 2% - SELESAI)**:
  - Menggunakan library `osmdroid-android:6.1.18`.
  - Di Checkout: Dialog peta interaktif untuk memilih titik rumah pelanggan.
  - Di Tracking: Menampilkan titik lokasi Outlet Erles Bakery (Ambil di Toko) dan simulasi garis rute kurir/Polyline (Diantar Kurir).
- [-] **Kamera (1%) & Galeri (1%) (DILEWATI SESUAI KESEPAKATAN)**:
  - Dilewati karena tidak relevan dengan alur pemesanan customer aplikasi toko roti dan membingungkan pengguna.

---

#### 📌 FASE 3: Integrasi API Laravel (Volley) & Cloud Messaging (FCM)
- [ ] Penambahan pustaka Volley & ApiClient (Konfirmasi pengguna terlebih dahulu)
- [ ] Penggantian mock data ke endpoint Laravel API (`GET /categories`, `GET /products`, `POST /orders`, `GET /orders/track/{code}`)
- [ ] Firebase Cloud Messaging (FCM) untuk notifikasi status pesanan
- [ ] Firebase In-App Messaging untuk banner promo
- [ ] Pengujian menyeluruh (*End-to-End Test*) & Penyusunan Laporan UTS

---

### Status Pengerjaan Terkini (Current State)
* **Tanggal Update**: 2026-10-10
* **Fase Aktif**: **FASE 1 SELESAI (100%) & FASE 2 (GPS & OSM) SELESAI (100%)**
* **Total Poin UTS Terkunci**: **34% Fitur Mobile + 10% Web Backend + 30% Laporan = 74%**
* **Langkah Berikutnya**:
  - Konfirmasi ke pengguna sebelum penambahan pustaka **Android Volley** untuk koneksi API MySQL Web Laravel.

