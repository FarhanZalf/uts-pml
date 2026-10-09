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
| 1 | RadioButton | ✅ Selesai | 1% | Pilihan metode pengiriman (Ambil di Toko / Diantar) di CheckoutActivity |
| 2 | CheckBox | ✅ Selesai | 1% | Opsi tambahan pesanan (Kartu Ucapan, Lilin, Pisau Kue) di CheckoutActivity |
| 3 | Button | ✅ Selesai | 1% | Tombol navigasi, Tambah Keranjang, Checkout, Lacak, WhatsApp CS |
| 4 | EditText | ✅ Selesai | 1% | Input nama, WA, alamat, catatan roti, dan pencarian kode pesanan |
| 5 | AutoCompleteTextView | ✅ Selesai | 1% | Pencarian interaktif katalog roti di MenuFragment |
| 6 | DatePickerDialog | ✅ Selesai | 1% | Pemilihan tanggal pengambilan pesanan di CheckoutActivity |
| 7 | TimePickerDialog | ✅ Selesai | 1% | Pemilihan jam pengambilan pesanan di CheckoutActivity |
| 8 | Spinner | ✅ Selesai | 1% | Filter kategori roti (Semua, Roti Manis, Cake, Pastry) di MenuFragment |
| 9 | ListView | ✅ Selesai | 1% | Menampilkan daftar katalog roti & keranjang belanja |
| 10 | OptionsMenu | ✅ Selesai | 1% | Menu aksi toolbar (Tentang Aplikasi, Refresh, Bantuan, WhatsApp CS) |
| 11 | ContextMenu | ✅ Selesai | 1% | Long-press pada item keranjang belanja (Hapus item / Tambah catatan) |
| 12 | PopupMenu | ✅ Selesai | 1% | Menu sortir harga termurah / termahal di MenuFragment |
| 13 | BottomNavigationView | ✅ Selesai | 1% | Navigasi menu utama: Menu Katalog, Keranjang, Lacak + Real-time Badge |
| 14 | FrameLayout | ✅ Selesai | 1% | Container untuk pergantian Fragment di MainActivity |
| 15 | Fragment | ✅ Selesai | 1% | MenuFragment, CartFragment, TrackingFragment |
| 16 | Activity | ✅ Selesai | 1% | MainActivity, ProductDetailActivity, CheckoutActivity |
| 17 | Database Sqlite | ✅ Selesai | 1% | CartDatabaseHelper: cart_items & orders_history offline |
| 18 | Database MySQL & Web Service/API | Dalam Antrean | 2% | Terintegrasi dengan API Laravel Erles Bakery ERP |
| 19 | Pustaka Volley | Dalam Antrean | 1% | Konsumsi HTTP REST API backend Laravel (JSON Request & Response) |
| 20 | Kamera | - | 1% | *(Dilewati - tidak relevan untuk alur pemesanan pembeli)* |
| 21 | GPS | ✅ Selesai | 2% | Deteksi otomatis koordinat GPS pelanggan via Fused/LocationManager di Checkout |
| 22 | Google Maps / OpenStreetMaps | ✅ Selesai | 2% | Peta OSM interaktif (pilih titik alamat di Checkout, rute pengantaran kurir & lokasi toko di Tracking) |
| 23 | SharedPreferences | ✅ Selesai | 1% | Menyimpan otomatis Nama & No. WA pelanggan di CheckoutActivity |
| 24 | Audio/Video | - | 1% | *(Dilewati sesuai kesepakatan fitur fokus bakery)* |
| 25 | QR-Code | ✅ Selesai | 2% | Generator QR-Code tiket pengambilan kasir (ZXing) di TrackingFragment |
| 26 | Gallery | - | 1% | *(Dilewati - tidak relevan untuk alur pemesanan pembeli)* |
| 27 | Aplikasi Web (DB Terintegrasi Mobile) | Siap (PTT) | 10% | Backend Web ERP Laravel Erles Bakery |
| 28 | Aplikasi IoT | - | 10% | *(Dilewati - fokus pada aplikasi pemesanan e-commerce)* |
| 29 | Firebase Authentication | - | 6% | *(Dilewati - pelanggan pesan langsung tanpa akun/guest checkout)* |
| 30 | Firebase Realtime / Firestore | - | 5% | *(Dilewati - database utama terintegrasi MySQL Laravel)* |
| 31 | Firebase Cloud Messaging (FCM) | Dalam Antrean | 6% | Notifikasi real-time update status pesanan (diproses/siap/selesai) |
| 32 | Firebase In-App Messaging | Dalam Antrean | 1% | Banner promosi diskon / produk baru di dalam aplikasi |
| 33 | Supabase Storage | Dalam Antrean | 7% | Cloud storage untuk upload foto bukti / custom cake pelanggan |
| 34 | Kelengkapan Isi Laporan | Dalam Antrean | 30% | Format dokumen teknis & presentasi demo UTS |

**Target Estimasi Skor:** **~88% - 90%+** (Sangat aman untuk predikat nilai A).
