# 📱 Dokumen Serah-Terima Backend Kotlin (Erles Bakery ERP)

Dokumen ini merupakan panduan spesifikasi dan kontrak integrasi untuk tim pengembang **Backend Kotlin (Ktor / Spring Boot)** yang akan melayani aplikasi mobile Android. Backend Kotlin harus berperilaku **identik (100% parity)** dengan backend referensi Laravel 13 yang terhubung ke database **MySQL 8**.

---

## 1. Konfigurasi Koneksi Database

Database MySQL 8 berjalan melalui Docker Compose pada repositori ini:

| Parameter | Lingkungan Lokal Host / Emulator | Lingkungan Antar-Container Docker |
| :--- | :--- | :--- |
| **Host** | `localhost` (atau `10.0.2.2` dari Emulator Android) | `erles_db` (atau nama service `db`) |
| **Port** | `3306` | `3306` |
| **Database Name** | `erles_bakery` | `erles_bakery` |
| **Username** | `erles` | `erles` |
| **Password** | `erles123` | `erles123` |
| **phpMyAdmin GUI** | [http://localhost:8081](http://localhost:8081) | - |

### Contoh Format JDBC URL
```text
jdbc:mysql://localhost:3306/erles_bakery?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Jakarta&characterEncoding=utf8
```

---

## 2. ⚠️ Aturan Keras (Non-Negotiable Constraints)

1. **DILARANG MENGUBAH ATAU MEMBUAT SKEMA DATABASE**:
   - Backend Kotlin **TIDAK BOLEH** menjalankan DDL otomatis seperti `SchemaUtils.create()`, Hibernate `ddl-auto: update/create`, Liquibase, atau Flyway mandiri.
   - Kepemilikan skema database sepenuhnya dipegang oleh migrasi Laravel di `backend/database/migrations/`.
   - Gunakan skema yang sudah ada persis sesuai `docs/schema-mysql.sql`.
2. **PORT SERVER KOTLIN**:
   - Backend Laravel menggunakan port `8000`.
   - Backend Kotlin **HARUS** menggunakan port lain saat pengujian lokal/container, misalnya port **`8080`**.

---

## 3. Ringkasan Skema Database & Data Awal

### Relasi Antar Tabel Utama
```
categories (1) ───< (N) products (1) ───< (N) order_items
                          │                     │
                          │                     ▼
customers (1) ──────< (N) orders (1) ────< (N) order_items
                          │
                          ├───< (N) payments
                          └───< (N) finance_transactions
```

### Detail Tabel Inti
- **`categories`**: `id` (PK AUTO_INCREMENT), `name` (varchar 255), `slug` (varchar 255 UNIQUE), `description` (text).
- **`products`**: `id` (PK), `nama`, `slug` (UNIQUE), `category_id` (FK -> categories.id ON DELETE SET NULL), `deskripsi`, `harga` (decimal 12,2), `stok` (int), `kategori` (varchar 255), `gambar` (nullable), `is_active` (tinyint/bool, default 1).
- **`customers`**: `id` (PK), `name`, `phone` (varchar 30 INDEX), `email` (nullable), `address` (text nullable), `notes` (nullable), `total_orders` (int default 0), `total_spent` (decimal 14,2 default 0), `firebase_uid` (varchar 128 UNIQUE nullable).
- **`orders`**: `id` (PK), `kode_pesanan` (varchar 255 UNIQUE), `customer_id` (FK -> customers.id ON DELETE SET NULL), `customer_name`, `customer_phone`, `alamat`, `catatan`, `tanggal_ambil` (date), `total_price` (decimal 14,2), `status` (varchar 50 default 'pending'), `payment_status` (varchar 30 default 'unpaid'), `paid_amount` (decimal 14,2 default 0).
- **`order_items`**: `id` (PK), `order_id` (FK -> orders.id ON DELETE CASCADE), `product_id` (FK -> products.id ON DELETE CASCADE), `qty` (int), `unit_price` (decimal 14,2), `subtotal` (decimal 14,2).
- **`payments`**: `id` (PK), `order_id` (FK -> orders.id ON DELETE CASCADE), `user_id` (FK -> users.id ON DELETE SET NULL), `nominal` (decimal 14,2), `metode` (varchar 50), `tipe` (varchar 50), `tanggal` (date), `catatan`, `bukti_bayar`.
- **`finance_transactions`**: `id` (PK), `tipe` ('pemasukan'/'pengeluaran'), `kategori`, `nominal`, `tanggal`, `catatan`, `user_id`, `order_id` (FK ON DELETE SET NULL).
- **`users`**: `id` (PK), `name`, `email` (UNIQUE), `phone`, `role` ('admin' / 'karyawan'), `password` (bcrypt).

### Data Seed Awal (Hasil Seeder)
- **Akun Default**:
  - Admin: `admin@erlesbakery.com` / `password` (role: `admin`)
  - Staff: `staff@erlesbakery.com` / `password` (role: `karyawan`)
- **Jumlah Baris Seed**:
  - `categories`: 4 kategori (`Roti`, `Kue`, `Kue Kering`, `Hampers`)
  - `products`: 15 produk
  - `orders`: 5 pesanan awal (beserta `order_items`)
  - `users`: 2 user

---

## 4. Aturan Bisnis Wajib (Diekstrak dari Sumber Laravel)

Developer Kotlin **WAJIB** mereplikasi seluruh aturan bisnis berikut agar kompatibel 100%:

### 1. Format dan Urutan `kode_pesanan`
- **File Sumber**: `backend/app/Models/Order.php` (fungsi `generateKodePesanan()`)
- **Format**: `ORD-{YYYYMMDD}-{XXXX}` (contoh: `ORD-20261009-0001`).
- **Aturan Urutan**:
  1. Ambil tanggal hari ini dalam format `Ymd` (cth: `20261009`).
  2. Prefix: `"ORD-" + Ymd + "-"`.
  3. Query database untuk pesanan dengan `kode_pesanan LIKE 'ORD-{YYYYMMDD}-%'` diurutkan descending (`ORDER BY kode_pesanan DESC LIMIT 1`).
  4. Ambil 4 digit terakhir: jika sudah ada, nomor berikutnya = angka terakhir + 1; jika belum ada, mulai dari 1.
  5. Format angka menjadi 4 digit padding nol di sebelah kiri (`0001`, `0002`, dst).

### 2. Penghitungan Total & Subtotal di Sisi Server
- **File Sumber**: `backend/app/Http/Controllers/OrderController.php` (fungsi `store()`)
- **Aturan**:
  - Client mobile **DILARANG** mengirimkan harga satuan (`unit_price`) atau subtotal.
  - Client hanya mengirimkan `items: [ { product_id, qty } ]`.
  - Backend mencari harga asli di database (`products.harga`).
  - Untuk setiap item: `subtotal = unit_price * qty`.
  - Total pesanan: `total_price = SUM(subtotal)`.
  - Server menyimpan `unit_price` dan `subtotal` ke tabel `order_items` sebagai catatan harga saat transaksi terjadi.

### 3. Validasi Pesanan Baru & Respon Error 422
- **File Sumber**: `backend/app/Http/Requests/OrderStoreRequest.php`
- **Aturan Validasi**:
  - `customer_name`: wajib, string, maks 255 karakter.
  - `customer_phone`: wajib, string, maks 20 karakter.
  - `alamat`: opsional, string.
  - `catatan`: opsional, string.
  - `tanggal_ambil`: opsional, format tanggal `YYYY-MM-DD`.
  - `items`: wajib, array, minimal 1 item.
  - `items.*.product_id`: wajib, integer, harus terdaftar di tabel `products`.
  - `items.*.qty`: wajib, integer, minimal 1.
- **Respon Error**:
  - Mengembalikan status HTTP **422 Unprocessable Entity**.
  - Pesan error:
    - `"Pesanan minimal harus memiliki 1 item produk."`
    - `"Produk yang dipilih tidak valid atau tidak ditemukan."`
    - `"Jumlah (qty) produk minimal 1."`
    - `"Nama pelanggan wajib diisi."`
    - `"Nomor WhatsApp / telepon pelanggan wajib diisi."`

### 4. Kebijakan Pengurangan Stok Produk
- **File Sumber**: `backend/app/Http/Controllers/OrderController.php` (fungsi `store()`)
- **Aturan**:
  - **STOK TIDAK BERKURANG saat pesanan dibuat oleh pelanggan.**
  - Pesanan baru berstatus `pending`. Pengurangan stok di sistem Erles Bakery ERP dilakukan secara manual/terpisah oleh staf toko saat pesanan diproses atau melalui modul stok (`ProductController::adjustStock`).
  - *Catatan Penting*: Developer Kotlin **TIDAK BOLEH** mengurangi stok produk di `POST /orders`.

### 5. Alur Status Pesanan, Alias, dan Penolakan Transisi Ilegal
- **File Sumber**: `backend/app/Models/Order.php` (array `$allowedTransitions`, `$statusAliases`, fungsi `canTransitionTo()`)
- **Status Kanonikal**: `pending`, `confirmed`, `processing`, `ready`, `completed`, `cancelled`.
- **Alias Status**:
  - `diproses` → `processing`
  - `selesai` → `completed`
  - `dibatalkan` → `cancelled`
- **Tabel Transisi yang Diizinkan**:
  | Status Saat Ini | Status Target yang Diizinkan |
  | :--- | :--- |
  | `pending` | `confirmed`, `processing`, `cancelled` (dan alias) |
  | `confirmed` | `processing`, `cancelled` (dan alias) |
  | `processing` | `ready`, `completed`, `cancelled` (dan alias) |
  | `ready` | `completed`, `cancelled` (dan alias) |
  | `completed` | *Terminal* (tidak boleh berpindah status) |
  | `cancelled` | *Terminal* (tidak boleh berpindah status) |
- **Penolakan**:
  - Jika transisi tidak valid (misal `pending` langsung ke `ready`, atau `completed` ke status lain), tolak dengan status HTTP **422**:
    ```json
    {
      "success": false,
      "message": "Transisi status dari '{oldStatus}' ke '{newStatus}' tidak diizinkan."
    }
    ```
- **Side Effect Transisi**:
  - Saat pesanan beralih ke `completed` / `selesai`, jika belum ada transaksi keuangan untuk pesanan tersebut, backend secara otomatis membuat transaksi pemasukan di `finance_transactions`.

### 6. Penghitungan `payment_status` dan `paid_amount`
- **File Sumber**: `backend/app/Models/Order.php` (`recalculatePaymentStatus()`) & `backend/app/Http/Controllers/PaymentController.php`
- **Aturan**:
  - `paid_amount` dihitung dari `SUM(payments.nominal)` milik order tersebut.
  - `payment_status`:
    - `unpaid`: Jika `paid_amount <= 0`.
    - `paid`: Jika `paid_amount >= total_price` (dan `total_price > 0`).
    - `partial`: Jika `0 < paid_amount < total_price`.
  - Sisa pembayaran dihitung dinamis: `max(0, total_price - paid_amount)`.
  - Pembayaran baru **tidak boleh melebihi sisa tagihan**. Jika melebihi, kembalikan HTTP 422:
    `"Nominal pembayaran (Rp X) melebihi sisa tagihan pesanan (Rp Y)."`

### 7. Pembuatan dan Pembaruan Data Pelanggan (`findOrCreateByPhone`)
- **File Sumber**: `backend/app/Models/Customer.php` (fungsi `findOrCreateByPhone()`)
- **Aturan**:
  1. Bersihkan input telepon dari karakter non-angka: `cleanPhone = replaceAll("[^0-9]", "")`.
  2. Cari record `customers` di mana `phone == phoneInput` ATAU `phone == cleanPhone`.
  3. Jika ditemukan:
     - Jika nama pelanggan di DB kosong atau bernilai `'Pelanggan'`, perbarui dengan nama yang diberikan di pesanan.
     - Jika alamat pelanggan di DB kosong dan pesanan menyertakan alamat, perbarui alamat.
  4. Jika tidak ditemukan:
     - Buat customer baru dengan `total_orders = 0`, `total_spent = 0`.
  5. Setelah order berhasil disimpan:
     - `customer.total_orders += 1`
     - `customer.total_spent += total_price`

### 8. Penggunaan Database Transaction (ACID)
- **File Sumber**: `backend/app/Http/Controllers/OrderController.php`
- **Aturan**:
  - Operasi penyimpanan pesanan melibatkan `customers`, `orders`, `order_items`, kalkulasi total, dan akumulasi pelanggan.
  - Seluruh rangkaian query ini **WAJIB** dibungkus dalam **1 Database Transaction**.
  - Jika terjadi exception atau kegagalan simpan pada salah satu tabel, lakukan **ROLLBACK** penuh.

---

## 5. Kontrak Endpoint Publik untuk Mobile

Semua respon sukses dibungkus dalam format envelope standar:
```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": { ... }
}
```

### 1. `GET /api/categories`
Mengambil seluruh kategori produk beserta jumlah produk terkait.

**Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar kategori berhasil diambil.",
  "data": [
    {
      "id": 1,
      "name": "Roti",
      "slug": "roti",
      "description": "Aneka roti tawar dan manis",
      "products_count": 4,
      "created_at": "2026-10-09T10:23:52.000000Z",
      "updated_at": "2026-10-09T10:23:52.000000Z"
    }
  ]
}
```

---

### 2. `GET /api/products`
Daftar produk aktif dengan pencarian, filter kategori, dan paginasi.

**Query Parameters**:
- `search` (opsional): kata kunci nama atau deskripsi produk.
- `kategori` (opsional): filter nama kategori (misal: `Roti`).
- `per_page` (opsional): jumlah item per halaman (default: `15`).
- `page` (opsional): nomor halaman (default: `1`).
- `sort_by` (opsional): `id`, `nama`, `harga`, `stok`, `created_at` (default: `id`).
- `sort_order` (opsional): `asc` atau `desc` (default: `asc`).

**Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar produk berhasil diambil.",
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "nama": "Roti Tawar Gandum",
      "slug": "roti-tawar-gandum",
      "deskripsi": "Roti tawar gandum utuh, lembut dan sehat.",
      "harga": 25000,
      "stok": 50,
      "kategori": "Roti",
      "gambar": null,
      "is_active": true,
      "created_at": "2026-10-09T10:23:52.000000Z",
      "updated_at": "2026-10-09T10:23:52.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 3,
    "total": 15
  }
}
```

---

### 3. `GET /api/products/{idOrSlug}`
Mendapatkan detail 1 produk berdasarkan ID numerik atau string slug.

**Contoh URL**:
- `/api/products/1`
- `/api/products/roti-tawar-gandum`

**Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Detail produk berhasil diambil.",
  "data": {
    "id": 1,
    "category_id": 1,
    "nama": "Roti Tawar Gandum",
    "slug": "roti-tawar-gandum",
    "deskripsi": "Roti tawar gandum utuh, lembut dan sehat.",
    "harga": 25000,
    "stok": 50,
    "kategori": "Roti",
    "gambar": null,
    "is_active": true,
    "category": {
      "id": 1,
      "name": "Roti",
      "slug": "roti",
      "description": "Aneka roti tawar dan manis"
    },
    "created_at": "2026-10-09T10:23:52.000000Z",
    "updated_at": "2026-10-09T10:23:52.000000Z"
  }
}
```

---

### 4. `POST /api/orders`
Membuat pesanan baru dari aplikasi mobile.

**Request Body**:
```json
{
  "customer_name": "Budi Santoso",
  "customer_phone": "081298765432",
  "alamat": "Jl. Merdeka No. 10, Jakarta",
  "catatan": "Tolong dibungkus terpisah.",
  "tanggal_ambil": "2026-10-15",
  "items": [
    {
      "product_id": 1,
      "qty": 2
    }
  ]
}
```

**Respon Sukses (201 Created)**:
```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat. Kami akan segera menghubungi Anda.",
  "data": {
    "id": 7,
    "customer_id": 1,
    "customer": {
      "id": 1,
      "name": "Budi Santoso",
      "phone": "081298765432",
      "email": null,
      "address": "Jl. Merdeka No. 10, Jakarta",
      "notes": null,
      "total_orders": 1,
      "total_spent": 50000,
      "firebase_uid": null,
      "created_at": "2026-10-09T10:34:44.000000Z",
      "updated_at": "2026-10-09T10:34:44.000000Z"
    },
    "kode_pesanan": "ORD-20261009-0007",
    "customer_name": "Budi Santoso",
    "customer_phone": "081298765432",
    "alamat": "Jl. Merdeka No. 10, Jakarta",
    "catatan": "Tolong dibungkus terpisah.",
    "tanggal_ambil": "2026-10-15",
    "total_price": 50000,
    "status": "pending",
    "payment_status": "unpaid",
    "paid_amount": 0,
    "sisa_pembayaran": 50000,
    "items": [
      {
        "id": 11,
        "order_id": 7,
        "product_id": 1,
        "product": {
          "id": 1,
          "category_id": 1,
          "nama": "Roti Tawar Gandum",
          "slug": "roti-tawar-gandum",
          "harga": 25000,
          "stok": 50,
          "kategori": "Roti"
        },
        "qty": 2,
        "unit_price": 25000,
        "subtotal": 50000
      }
    ],
    "created_at": "2026-10-09T10:34:44.000000Z",
    "updated_at": "2026-10-09T10:34:44.000000Z"
  }
}
```

---

### 5. `GET /api/orders/track/{idOrCode}`
Melacak status pesanan publik menggunakan ID atau `kode_pesanan`.

**Contoh URL**:
- `/api/orders/track/ORD-20261009-0007`
- `/api/orders/track/7`

**Respon Sukses (200 OK)**:
Format data identik dengan payload `data` pada pembuatan pesanan di atas.

---

## 6. Format Respon Error Standar

Backend Kotlin harus mengembalikan format JSON error yang konsisten dengan klien:

### 1. Error 404 Not Found
```json
{
  "success": false,
  "message": "Pesanan tidak ditemukan."
}
```
*(atau `"Produk tidak ditemukan."`)*

### 2. Error 422 Unprocessable Entity (Validasi Input)
```json
{
  "message": "Pesanan minimal harus memiliki 1 item produk.",
  "errors": {
    "items": [
      "Pesanan minimal harus memiliki 1 item produk."
    ]
  }
}
```

### 3. Error 429 Too Many Requests (Rate Limiting)
```json
{
  "message": "Too Many Attempts."
}
```
*(Public API throttle: 60 request / menit)*
