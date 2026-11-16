<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderEncryptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_alamat_and_catatan_are_stored_encrypted_with_aes(): void
    {
        $plainAlamat = 'Jl. Kenari No. 45, RT 02/RW 05, Bandung';
        $plainCatatan = 'Tolong bungkus pakai pita emas dan bubble wrap tebal';

        $order = Order::create([
            'kode_pesanan' => Order::generateKodePesanan(),
            'customer_name' => 'Budi Santoso',
            'customer_phone' => '081234567890',
            'alamat' => $plainAlamat,
            'catatan' => $plainCatatan,
            'tanggal_ambil' => now()->addDay()->toDateString(),
            'total_price' => 150000,
            'status' => 'pending',
        ]);

        // 1. Ambil data mentah langsung dari MySQL/Database (tanpa Eloquent casting)
        $rawOrder = DB::table('orders')->where('id', $order->id)->first();

        // Pastikan di database tidak tersimpan plain-text
        $this->assertNotEquals($plainAlamat, $rawOrder->alamat);
        $this->assertNotEquals($plainCatatan, $rawOrder->catatan);

        // Pastikan nilai di database valid didekripsi menggunakan AES Laravel (Crypt::decryptString)
        $this->assertEquals($plainAlamat, Crypt::decryptString($rawOrder->alamat));
        $this->assertEquals($plainCatatan, Crypt::decryptString($rawOrder->catatan));

        // 2. Ambil melalui Eloquent Model dan pastikan otomatis terdekripsi transparan
        $fetchedOrder = Order::find($order->id);
        $this->assertEquals($plainAlamat, $fetchedOrder->alamat);
        $this->assertEquals($plainCatatan, $fetchedOrder->catatan);
    }

    public function test_legacy_unencrypted_order_data_can_be_read_gracefully(): void
    {
        $plainAlamat = 'Jl. Merdeka No. 10, Jakarta Pusat';
        $plainCatatan = 'Pesanan lama sebelum enkripsi aktif';

        // Simpan langsung via DB::table (mensimulasikan data lama yang belum terenkripsi)
        $orderId = DB::table('orders')->insertGetId([
            'kode_pesanan' => 'ORD-LEGACY-0001',
            'customer_name' => 'Pelanggan Lama',
            'customer_phone' => '08111222333',
            'alamat' => $plainAlamat,
            'catatan' => $plainCatatan,
            'tanggal_ambil' => now()->toDateString(),
            'total_price' => 50000,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Model Eloquent harus bisa membaca tanpa melempar DecryptException
        $order = Order::find($orderId);
        $this->assertEquals($plainAlamat, $order->alamat);
        $this->assertEquals($plainCatatan, $order->catatan);
    }
}

