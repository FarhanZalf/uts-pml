package farhan.zalfanudin.uts.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Handler
import android.os.Looper
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

object SupabaseStorageUtil {

    const val SUPABASE_URL = "https://iohzdauarxzbcynxvgpr.supabase.co"
    const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaHpkYXVhcnh6YmN5bnh2Z3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjg2ODksImV4cCI6MjEwNjg0NDY4OX0.MXoM_uCKhpeii37rZAtp6kaTU8BWEdiLoABphVKa7kU"
    const val BUCKET_NAME = "bukti-pembayaran"

    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    /**
     * #33 & #26: Pengunggahan bukti transfer ke Supabase Storage
     */
    fun uploadPaymentProof(
        context: Context,
        imageUri: Uri,
        orderCode: String,
        onStart: () -> Unit,
        onSuccess: (publicUrl: String, bitmap: Bitmap) -> Unit,
        onError: (errorMessage: String, fallbackBitmap: Bitmap?) -> Unit
    ) {
        onStart()

        executor.execute {
            var scaledBitmap: Bitmap? = null
            try {
                // 1. Baca data gambar dari Uri Galeri / Kamera HP
                val inputStream: InputStream? = context.contentResolver.openInputStream(imageUri)
                if (inputStream == null) {
                    mainHandler.post { onError("Gagal membuka file gambar dari perangkat.", null) }
                    return@execute
                }

                val originalBitmap = BitmapFactory.decodeStream(inputStream)
                inputStream.close()

                if (originalBitmap == null) {
                    mainHandler.post { onError("Format gambar tidak dikenali.", null) }
                    return@execute
                }

                // 2. Optimasi resolusi bitmap agar hemat kuota & cepat terkirim
                scaledBitmap = scaleBitmapIfNeeded(originalBitmap, 1200)
                val byteArrayOutputStream = ByteArrayOutputStream()
                scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, byteArrayOutputStream)
                val imageBytes = byteArrayOutputStream.toByteArray()

                // 3. Susun nama file unik di Supabase
                val cleanOrderCode = orderCode.replace(Regex("[^a-zA-Z0-9-]"), "_")
                val fileName = "bukti_${cleanOrderCode}_${System.currentTimeMillis()}.jpg"

                // 4. Endpoint Supabase Storage: POST /storage/v1/object/{bucket}/{filename}
                val uploadEndpoint = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$fileName"
                val url = URL(uploadEndpoint)
                val conn = url.openConnection() as HttpURLConnection

                conn.requestMethod = "POST"
                conn.doOutput = true
                conn.doInput = true
                conn.useCaches = false
                conn.connectTimeout = 15000
                conn.readTimeout = 15000

                // Header otentikasi resmi Supabase
                conn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
                conn.setRequestProperty("Authorization", "Bearer $SUPABASE_ANON_KEY")
                conn.setRequestProperty("Content-Type", "image/jpeg")
                conn.setRequestProperty("x-upsert", "true")
                conn.setFixedLengthStreamingMode(imageBytes.size)

                // 5. Tulis binary gambar ke body request
                conn.outputStream.use { os ->
                    os.write(imageBytes)
                    os.flush()
                }

                val responseCode = conn.responseCode
                if (responseCode in 200..299) {
                    // Berhasil diunggah! Susun URL publik file di Supabase
                    val publicUrl = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$fileName"
                    mainHandler.post {
                        onSuccess(publicUrl, scaledBitmap)
                    }
                } else {
                    val errorBody = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                    mainHandler.post {
                        onError("Gagal mengunggah ke Supabase (HTTP $responseCode): $errorBody", scaledBitmap)
                    }
                }
                conn.disconnect()

            } catch (e: Exception) {
                mainHandler.post {
                    onError("Terjadi kesalahan koneksi cloud: ${e.localizedMessage ?: e.message}", scaledBitmap)
                }
            }
        }
    }

    private fun scaleBitmapIfNeeded(bitmap: Bitmap, maxDimension: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        if (width <= maxDimension && height <= maxDimension) return bitmap

        val ratio = width.toFloat() / height.toFloat()
        val newWidth: Int
        val newHeight: Int
        if (width > height) {
            newWidth = maxDimension
            newHeight = (maxDimension / ratio).toInt()
        } else {
            newHeight = maxDimension
            newWidth = (maxDimension * ratio).toInt()
        }
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
}
