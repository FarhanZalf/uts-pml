# Pemicu In-App Messaging (Programmatic Trigger)

- **Nama Event**: `promo_app_open`

### Cara Mengubah Trigger di Firebase Console
1. Buka Firebase Console > **Engage** > **In-App Messaging**.
2. Buat kampanye baru atau edit kampanye promo yang ada.
3. Pada langkah **Scheduling** > bagian **Trigger**, pilih **Event**.
4. Ketik dan pilih nama event kustom: `promo_app_open`.
5. Simpan dan publikasikan kampanye.

### Cara Pengujian di Perangkat
1. Hapus data aplikasi: `adb shell pm clear farhan.zalfanudin.uts` (atau lewat Pengaturan > Aplikasi > Hapus Data).
2. Buka aplikasi dua kali (buka pertama mengunduh kampanye dari Firebase, buka kedua memicu tampilan pesan).
