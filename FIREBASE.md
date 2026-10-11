# 🔥 Panduan Integrasi & Demo Firebase — Erles Bakery Mobile

Aplikasi mobile Android **Erles Bakery** telah terintegrasi dengan Firebase:
1. **Firebase Authentication**: Pendaftaran akun dan login berbasis email/password (opsional; tamu tetap dapat belanja).
2. **Cloud Firestore**: Sinkronisasi profil `users/{uid}` dan pelacakan status pesanan secara realtime di `order_status/{kode_pesanan}` dengan indikator `● Realtime`.
3. **Firebase Cloud Messaging (FCM)**: Menerima pembaruan status pesanan via topic `order_<kode_pesanan>` dan navigasi otomatis saat notifikasi diketuk.
4. **Firebase In-App Messaging**: Kampanye interaktif "app open" langsung dari Firebase Console.

---

## 📁 1. File & Kredensial yang Harus Disediakan

1. **`app/google-services.json`**:
   - Diletakkan di direktori: `mobile/app/google-services.json`.
   - File ini didapat dari **Firebase Console > Project Settings > Your apps > Android app** (`farhan.zalfanudin.uts`).
   - ⚠️ **PENTING**: File ini bersifat rahasia dan sudah diabaikan oleh `.gitignore` agar tidak ter-commit ke git.
2. **Firebase Admin Service Account Key JSON** (Untuk Skrip CLI Cloud):
   - Disimpan **di luar repositori** (misal: `C:\Users\ASUS\keys\utspml-35739-firebase-adminsdk-fbsvc-afb03c6e72.json`).
   - Digunakan oleh skrip seeder dan `set-status.js` di folder `cloud/firebase/`.

---

## 📱 2. Catatan Penting Perangkat / Emulator

> [!IMPORTANT]
> - Untuk menguji **Firebase Cloud Messaging (FCM)** dan **In-App Messaging**, pastikan Emulator Android menggunakan System Image yang memiliki **Google Play** (terdapat logo Play Store di Android Studio Device Manager).
> - Emulator tanpa Google Play (*AOSP*) tidak memiliki Google Play Services sehingga token FCM tidak dapat di-generate.
> - Rekomendasi terbaik: Gunakan **HP Android Fisik** (koneksikan via USB Debugging atau WiFi ADB) atau emulator API 33/34 Google Play.

---

## 🚀 3. Skenario Langkah Demo Lengkap

### Skenario A: Pendaftaran Akun & Auto-Fill Checkout
1. Buka aplikasi di HP / Emulator.
2. Ketuk menu tiga titik (pojok kanan atas Toolbar) ➔ pilih **"🔑 Masuk / Daftar Akun"**.
3. Pilih tab **"Daftar Akun"**, lalu isi form:
   - Nama Lengkap: `Mochamad Farhan`
   - Nomor WhatsApp / HP: `081234567890`
   - Email: `farhan@example.com`
   - Kata Sandi: `password123`
   - Ulangi Kata Sandi: `password123`
4. Ketuk **"Daftar Akun Baru"**.
   - Akun tersimpan di Firebase Authentication.
   - Dokumen profil tersimpan otomatis di Firestore: `users/{uid}` `{name, phone, created_at}`.
5. Masuk ke Tab **Katalog**, tambahkan beberapa roti ke keranjang, lalu ketuk **Checkout**.
   - Nama pemesan dan Nomor WhatsApp akan **terisi otomatis** dari data akun yang sedang login.

---

### Skenario B: Checkout & Pelacakan Status Realtime
1. Di layar Checkout, lengkapi jadwal pengambilan lalu ketuk **"Konfirmasi & Pesan Sekarang"**.
2. Aplikasi akan membuat pesanan ke MySQL via Volley, menyimpan tiket lokal, dan **otomatis subscribe ke topic FCM** `order_<kode_pesanan>` (misal: `order_ORD-20261009-0004`).
3. Masuk ke Tab **Lacak** (ikon truk di Bottom Navigation):
   - Status pesanan ditampilkan dari database.
   - Listener Firestore aktif pada dokumen `order_status/{kode_pesanan}` (terlihat indikator hijau `● Realtime`).

---

### Skenario C: Simulasi Update Status via Cloud CLI & Notifikasi FCM
1. Buka terminal komputer Anda, arahkan ke folder `cloud/firebase/`:
   ```bash
   cd d:\pml\cloud\firebase
   ```
2. Pastikan environment variable mengarah ke private key Anda:
   - **PowerShell**:
     ```powershell
     $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Users\ASUS\keys\utspml-35739-firebase-adminsdk-fbsvc-afb03c6e72.json"
     ```
   - **CMD**:
     ```cmd
     set GOOGLE_APPLICATION_CREDENTIALS=C:\Users\ASUS\keys\utspml-35739-firebase-adminsdk-fbsvc-afb03c6e72.json
     ```
3. Ubah status pesanan secara realtime:
   ```bash
   npm run set-status -- ORD-20261009-0004 processing
   ```
4. **Amati Layar HP / Emulator**:
   - Status di Tab Lacak seketika berubah menjadi **"Sedang Diproses Dapur"** secara realtime tanpa perlu menekan tombol refresh.
   - Notifikasi FCM muncul di status bar:
     - **Judul**: *Pesanan ORD-20261009-0004*
     - **Pesan**: *Pesanan Anda sedang diproses dan dipanggang di dapur.*
5. **Ketuk notifikasi tersebut**:
   - Aplikasi otomatis membuka Tab Lacak dan menampilkan rincian pesanan dengan kode tersebut.

---

### Skenario D: Keluar Akun & Belanja sebagai Tamu
1. Buka menu Toolbar kanan atas ➔ ketuk **"👤 [Nama Anda] (Keluar)"**.
2. Konfirmasi keluar.
3. Anda tetap dapat menjelajahi menu, menambahkan produk ke keranjang, dan melakukan pemesanan seperti biasa tanpa harus login (*Guest Mode*).
