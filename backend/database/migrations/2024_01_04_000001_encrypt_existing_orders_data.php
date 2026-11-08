<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Encrypt existing plain-text alamat and catatan in orders table with AES-256-CBC.
     */
    public function up(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        $orders = DB::table('orders')->get();

        foreach ($orders as $order) {
            $updates = [];

            if (!empty($order->alamat)) {
                try {
                    Crypt::decryptString($order->alamat);
                } catch (\Throwable) {
                    $updates['alamat'] = Crypt::encryptString($order->alamat);
                }
            }

            if (!empty($order->catatan)) {
                try {
                    Crypt::decryptString($order->catatan);
                } catch (\Throwable) {
                    $updates['catatan'] = Crypt::encryptString($order->catatan);
                }
            }

            if (!empty($updates)) {
                DB::table('orders')->where('id', $order->id)->update($updates);
            }
        }
    }

    /**
     * Reverse the migrations.
     * Decrypt alamat and catatan back to plain text.
     */
    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        $orders = DB::table('orders')->get();

        foreach ($orders as $order) {
            $updates = [];

            if (!empty($order->alamat)) {
                try {
                    $updates['alamat'] = Crypt::decryptString($order->alamat);
                } catch (\Throwable) {
                    // Sudah berupa plain-text
                }
            }

            if (!empty($order->catatan)) {
                try {
                    $updates['catatan'] = Crypt::decryptString($order->catatan);
                } catch (\Throwable) {
                    // Sudah berupa plain-text
                }
            }

            if (!empty($updates)) {
                DB::table('orders')->where('id', $order->id)->update($updates);
            }
        }
    }
};

