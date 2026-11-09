package farhan.zalfanudin.uts.crypto

import android.util.Base64
import java.security.GeneralSecurityException
import java.security.SecureRandom
import java.util.StringTokenizer
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * Implementasi Kriptografi AES persis sesuai Modul Kuliah:
 * Pemrograman Mobile Lanjut - Pertemuan 11 / PML 14
 * Dosen: Benni Agung Nugroho, S.Kom., M.Cs.
 * Algoritma: AES/CBC/PKCS5PADDING dengan dummy prefix verifikasi.
 */
object AesPertemuan11 {

    val panjangKey = setOf(16, 24, 32)
    const val dummyStr = "0000000000000000:;"

    fun generateSecretKey(secret: String): SecretKeySpec? {
        if (secret.length !in panjangKey) {
            return null
        }
        return SecretKeySpec(secret.toByteArray(), "AES")
    }

    fun generateInitVect(): IvParameterSpec {
        val iv = ByteArray(16)
        val secureRandom = SecureRandom()
        secureRandom.nextBytes(iv)
        return IvParameterSpec(iv)
    }

    fun encrypt(plainText: String, secretKey: SecretKey?, iv: IvParameterSpec): String {
        if (secretKey == null) return ""
        return try {
            val cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, iv)
            val encryptedText = cipher.doFinal((dummyStr + plainText).toByteArray())
            // Simpan IV di depan (16 bytes) agar saat dekripsi IV dapat dipulihkan
            val combined = iv.iv + encryptedText
            Base64.encodeToString(combined, Base64.DEFAULT)
        } catch (e: Exception) {
            ""
        }
    }

    fun decrypt(encryptedText: String, secretKey: SecretKey?): String {
        if (secretKey == null) return ""
        return try {
            val decoded = Base64.decode(encryptedText, Base64.DEFAULT)
            if (decoded.size < 16) return ""
            val ivBytes = decoded.copyOfRange(0, 16)
            val cipherBytes = decoded.copyOfRange(16, decoded.size)

            val iv = IvParameterSpec(ivBytes)
            val cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")
            cipher.init(Cipher.DECRYPT_MODE, secretKey, iv)
            val decryptedBytes = cipher.doFinal(cipherBytes)
            val tokens = StringTokenizer(String(decryptedBytes), ":;")
            tokens.nextToken() // buang dummyStr
            tokens.nextToken() // ambil plainText asli
        } catch (e: GeneralSecurityException) {
            ""
        } catch (e: Exception) {
            ""
        }
    }
}
