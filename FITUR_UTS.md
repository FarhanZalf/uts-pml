# DOKUMENTASI FITUR APLIKASI MOBILE UTS
## Mata Kuliah: Pemrograman Mobile Lanjut (PML)
**Program Studi D3 Manajemen Informatika - PSDKU Kota Kediri**  
**Politeknik Negeri Malang**

---

### Informasi Proyek
* **Judul Proyek PTT (Web Backend)**: Erles Bakery ERP (Laravel + MySQL)
* **Judul Aplikasi Mobile**: Erles Bakery Publik (Aplikasi Pemesanan Pelanggan)
* **Dosen Pengampu**: Benni Agung Nugroho, S.Kom., M.Cs.
* **Anggota Kelompok**:
  1. Mochamad Farhan Zalfanudin (`FarhanZalf` / `farhanzalfanudin@gmail.com`)
  2. Chelsea Cinta An Anlisty (`chelseaonlyuniv-cmd`)
* **Repositori GitHub**: [https://github.com/FarhanZalf/uts-pml](https://github.com/FarhanZalf/uts-pml)
* **Stack Teknologi**:
  * Bahasa: Kotlin
  * UI: XML Layouts + ViewBinding (minSdk 26, targetSdk 36)
  * Networking: Android Volley
  * Database Lokal: SQLiteOpenHelper
  * Cloud Storage: Supabase Storage
  * Push Notification: Firebase Cloud Messaging (FCM) & In-App Messaging

---

### Tabel Pemetaan & Verifikasi Fitur Aplikasi

Sesuai dengan tabel kriteria penilaian lembar soal UTS PML:

| No. | Nama Fitur | Status | Bobot | Lokasi Implementasi / Keterangan |
|---|---|:---:|:---:|---|
| 1 | RadioButton | Dalam Antrean | 1% | Pilihan metode pengiriman (Ambil di Toko / Diantar) di Checkout |
| 2 | CheckBox | Dalam Antrean | 1% | Opsi tambahan pesanan (Tulisan ucapan, Tambah lilin) di Checkout |
| 3 | Button | Dalam Antrean | 1% | Tombol navigasi, Tambah ke Keranjang, Checkout, Pesan Sekarang |
| 4 | EditText | Dalam Antrean | 1% | Input nama pemesan, nomor WhatsApp/telepon, alamat, dan catatan |
| 5 | AutoCompleteTextView | Dalam Antrean | 1% | Pencarian produk roti secara interaktif di Tab Menu |
| 6 | DatePickerDialog | Dalam Antrean | 1% | Pemilihan tanggal pengambilan/pengantaran pesanan |
| 7 | TimePickerDialog | Dalam Antrean | 1% | Pemilihan jam pengambilan/pengantaran pesanan |
| 8 | Spinner | Dalam Antrean | 1% | Filter kategori roti (Semua, Roti Manis, Cake, Pastry, dll.) |
| 9 | ListView | Dalam Antrean | 1% | Menampilkan daftar katalog produk roti pada Tab Menu |
| 10 | OptionsMenu | Dalam Antrean | 1% | Menu aksi pada toolbar (Tentang Aplikasi, Refresh, Bantuan) |
| 11 | ContextMenu | Dalam Antrean | 1% | Long-press pada item keranjang (Hapus item / Ubah catatan) |
| 12 | PopupMenu | Dalam Antrean | 1% | Menu opsi filter dan sortir cepat harga produk |
| 13 | BottomNavigationView | Dalam Antrean | 1% | Navigasi menu utama: Menu Katalog, Keranjang, dan Lacak Pesanan |
| 14 | FrameLayout | Dalam Antrean | 1% | Container untuk pergantian Fragment navigasi utama |
| 15 | Fragment | Dalam Antrean | 1% | MenuFragment, CartFragment, TrackingFragment |
| 16 | Activity | Siap (Setup) | 1% | MainActivity, ProductDetailActivity, CheckoutActivity, SuccessActivity |
| 17 | Database Sqlite | Dalam Antrean | 1% | Penyimpanan keranjang belanja (cart_items) & riwayat lokal |
| 18 | Database MySQL & Web Service/API | Dalam Antrean | 2% | Terintegrasi dengan API Laravel Erles Bakery ERP |
| 19 | Pustaka Volley | Dalam Antrean | 1% | Konsumsi HTTP REST API backend Laravel (JSON Request & Response) |
| 20 | Kamera | Dalam Antrean | 1% | Pengambilan foto referensi custom cake / bukti pembayaran |
| 21 | GPS | Dalam Antrean | 2% | Deteksi koordinat lokasi pelanggan untuk pengantaran pesanan |
| 22 | Google Maps / OpenStreetMaps | Dalam Antrean | 2% | Tampilan peta penjemputan/pengantaran & rute ke toko roti |
| 23 | SharedPreferences | Dalam Antrean | 1% | Menyimpan preferensi nama, nomor HP, dan riwayat terakhir pemesan |
| 24 | Audio/Video | - | 1% | *(Dilewati sesuai kesepakatan fitur fokus bakery)* |
| 25 | QR-Code | Dalam Antrean | 2% | Scanner QR Code nota/tiket pengambilan pesanan di outlet |
| 26 | Gallery | Dalam Antrean | 1% | Pilih gambar dari galeri HP untuk lampiran pesanan custom |
| 27 | Aplikasi Web (DB Terintegrasi Mobile) | Siap (PTT) | 10% | Backend Web ERP Laravel Erles Bakery |
| 28 | Aplikasi IoT | - | 10% | *(Dilewati - fokus pada aplikasi pemesanan e-commerce)* |
| 29 | Firebase Authentication | - | 6% | *(Dilewati - pelanggan pesan langsung tanpa akun/guest checkout)* |
| 30 | Firebase Realtime / Firestore | - | 5% | *(Dilewati - database utama terintegrasi MySQL Laravel)* |
| 31 | Firebase Cloud Messaging (FCM) | Dalam Antrean | 6% | Notifikasi real-time update status pesanan (diproses/siap/selesai) |
| 32 | Firebase In-App Messaging | Dalam Antrean | 1% | Banner promosi diskon / produk baru di dalam aplikasi |
| 33 | Supabase Storage | Dalam Antrean | 7% | Cloud storage untuk upload foto bukti / custom cake pelanggan |
| 34 | Kelengkapan Isi Laporan | Dalam Antrean | 30% | Format dokumen teknis & presentasi demo UTS |

**Target Estimasi Skor:** **~88% - 90%+** (Sangat aman untuk predikat nilai A).
