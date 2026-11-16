<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class SafeEncrypted implements CastsAttributes
{
    /**
     * Cast the given value (decrypt with AES when reading from database).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if (is_null($value) || $value === '') {
            return $value;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException) {
            // Fallback graceful ke nilai plain text asli jika record lama belum dienkripsi
            return $value;
        } catch (\Throwable) {
            return $value;
        }
    }

    /**
     * Prepare the given value for storage (encrypt with AES when writing to database).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if (is_null($value) || $value === '') {
            return $value;
        }

        // Hindari enkripsi ganda jika string yang diberikan sudah berupa ciphertext terenkripsi
        try {
            Crypt::decryptString((string) $value);
            return (string) $value;
        } catch (\Throwable) {
            return Crypt::encryptString((string) $value);
        }
    }

    /**
     * Helper to detect if a value is an encrypted payload.
     */
    public static function isEncrypted(mixed $value): bool
    {
        if (empty($value) || !is_string($value)) {
            return false;
        }

        try {
            Crypt::decryptString($value);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}

