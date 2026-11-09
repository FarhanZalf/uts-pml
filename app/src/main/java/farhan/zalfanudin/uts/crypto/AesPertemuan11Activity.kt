package farhan.zalfanudin.uts.crypto

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import farhan.zalfanudin.uts.databinding.ActivityAesPertemuan11Binding

class AesPertemuan11Activity : AppCompatActivity() {

    private lateinit var binding: ActivityAesPertemuan11Binding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAesPertemuan11Binding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = "PML 14 - Kriptografi AES"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        // Default contoh seperti pada Halaman 9 PDF Modul
        binding.edPlainText.setText("Polinema Joss, MI Yes")

        binding.btnEncrypt.setOnClickListener {
            val textToEncrypt = binding.edPlainText.text.toString().trim()
            val secret = binding.edSecretKey.text.toString().trim()

            if (textToEncrypt.isEmpty()) {
                Toast.makeText(this, "Masukkan teks yang akan dienkripsi", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val secretKey = AesPertemuan11.generateSecretKey(secret)
            if (secretKey == null) {
                Toast.makeText(this, "Panjang key harus 16/24/32 karakter", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }

            val iv = AesPertemuan11.generateInitVect()
            val encrypted = AesPertemuan11.encrypt(textToEncrypt, secretKey, iv)
            binding.edEncryptedText.setText(encrypted)

            Toast.makeText(this, "Teks berhasil dienkripsi (AES-CBC)!", Toast.LENGTH_SHORT).show()
        }

        binding.btnDecrypt.setOnClickListener {
            val encryptedText = binding.edEncryptedText.text.toString().trim()
            val secret = binding.edSecretKey2.text.toString().trim()

            if (encryptedText.isEmpty()) {
                Toast.makeText(this, "Text terenkripsi masih kosong", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val secretKey = AesPertemuan11.generateSecretKey(secret)
            if (secretKey == null) {
                Toast.makeText(this, "Panjang key harus 16/24/32 karakter", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }

            val decrypted = AesPertemuan11.decrypt(encryptedText, secretKey)
            if (decrypted.isNotEmpty()) {
                binding.edDecryptedText.setText(decrypted)
                Toast.makeText(this, "Teks berhasil didekripsi!", Toast.LENGTH_SHORT).show()
            } else {
                binding.edDecryptedText.setText("")
                Toast.makeText(this, "Key salah atau data rusak!", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnClose.setOnClickListener {
            finish()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
