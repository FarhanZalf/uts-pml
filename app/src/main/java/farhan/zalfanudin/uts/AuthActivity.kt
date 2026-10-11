package farhan.zalfanudin.uts

import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.firestore.FirebaseFirestore
import farhan.zalfanudin.uts.databinding.ActivityAuthBinding

class AuthActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAuthBinding
    private val auth by lazy { FirebaseAuth.getInstance() }
    private val firestore by lazy { FirebaseFirestore.getInstance() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        binding = ActivityAuthBinding.inflate(layoutInflater)
        setContentView(binding.root)

        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.scrollAuth.setPadding(0, systemBars.top, 0, systemBars.bottom)
            insets
        }

        setupTabButtons()
        setupActionListeners()
    }

    private fun setupTabButtons() {
        binding.btnTabLogin.setOnClickListener {
            switchToTab(isLogin = true)
        }
        binding.btnTabRegister.setOnClickListener {
            switchToTab(isLogin = false)
        }
        binding.tvSwitchToRegister.setOnClickListener {
            switchToTab(isLogin = false)
        }
        binding.tvSwitchToLogin.setOnClickListener {
            switchToTab(isLogin = true)
        }
        binding.btnAuthBack.setOnClickListener {
            finish()
        }
        binding.btnContinueAsGuest.setOnClickListener {
            Toast.makeText(this, "Melanjutkan sebagai Tamu (Belanja tanpa login)", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun switchToTab(isLogin: Boolean) {
        if (isLogin) {
            binding.btnTabLogin.setBackgroundResource(R.drawable.bg_button_primary)
            binding.btnTabLogin.setTextColor(getColor(R.color.white))
            binding.btnTabRegister.setBackgroundColor(getColor(android.R.color.transparent))
            binding.btnTabRegister.setTextColor(getColor(R.color.text_secondary))

            binding.layoutLoginForm.visibility = View.VISIBLE
            binding.layoutRegisterForm.visibility = View.GONE
            binding.tvAuthHeaderTitle.text = "Masuk ke Akun"
        } else {
            binding.btnTabRegister.setBackgroundResource(R.drawable.bg_button_primary)
            binding.btnTabRegister.setTextColor(getColor(R.color.white))
            binding.btnTabLogin.setBackgroundColor(getColor(android.R.color.transparent))
            binding.btnTabLogin.setTextColor(getColor(R.color.text_secondary))

            binding.layoutLoginForm.visibility = View.GONE
            binding.layoutRegisterForm.visibility = View.VISIBLE
            binding.tvAuthHeaderTitle.text = "Daftar Akun Baru"
        }
    }

    private fun setupActionListeners() {
        binding.btnSubmitLogin.setOnClickListener {
            val email = binding.etLoginEmail.text.toString().trim()
            val password = binding.etLoginPassword.text.toString().trim()

            if (!validateLoginForm(email, password)) return@setOnClickListener

            setLoading(true)
            auth.signInWithEmailAndPassword(email, password)
                .addOnSuccessListener { authResult ->
                    val user = authResult.user
                    val uid = user?.uid
                    if (uid != null) {
                        // Ambil nama & phone dari Firestore untuk melengkapi profil SharedPreferences
                        firestore.collection("users").document(uid).get()
                            .addOnSuccessListener { doc ->
                                val name = doc.getString("name") ?: user.displayName ?: ""
                                val phone = doc.getString("phone") ?: ""
                                saveUserPreferences(name, phone)
                            }
                            .addOnCompleteListener {
                                setLoading(false)
                                val displayName = user.displayName ?: email.substringBefore("@")
                                Toast.makeText(this, "Selamat datang kembali, $displayName!", Toast.LENGTH_SHORT).show()
                                finish()
                            }
                    } else {
                        setLoading(false)
                        Toast.makeText(this, "Berhasil masuk!", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                }
                .addOnFailureListener { e ->
                    setLoading(false)
                    val friendlyMsg = when (e) {
                        is FirebaseAuthInvalidCredentialsException -> "Email atau kata sandi tidak sesuai."
                        else -> e.localizedMessage ?: "Gagal masuk. Periksa koneksi internet Anda."
                    }
                    Toast.makeText(this, friendlyMsg, Toast.LENGTH_LONG).show()
                }
        }

        binding.btnSubmitRegister.setOnClickListener {
            val name = binding.etRegisterName.text.toString().trim()
            val phone = binding.etRegisterPhone.text.toString().trim()
            val email = binding.etRegisterEmail.text.toString().trim()
            val password = binding.etRegisterPassword.text.toString().trim()
            val confirm = binding.etRegisterConfirmPassword.text.toString().trim()

            if (!validateRegisterForm(name, phone, email, password, confirm)) return@setOnClickListener

            setLoading(true)
            auth.createUserWithEmailAndPassword(email, password)
                .addOnSuccessListener { authResult ->
                    val user = authResult.user
                    val uid = user?.uid ?: return@addOnSuccessListener

                    // 1. Update Display Name di FirebaseAuth
                    val profileUpdate = UserProfileChangeRequest.Builder()
                        .setDisplayName(name)
                        .build()
                    user.updateProfile(profileUpdate)

                    // 2. Tulis dokumen users/{uid} {name, phone, created_at} di Firestore
                    val userData = hashMapOf(
                        "name" to name,
                        "phone" to phone,
                        "created_at" to Timestamp.now()
                    )

                    firestore.collection("users").document(uid).set(userData)
                        .addOnSuccessListener {
                            saveUserPreferences(name, phone)
                            setLoading(false)
                            Toast.makeText(this, "Pendaftaran berhasil! Selamat datang, $name.", Toast.LENGTH_LONG).show()
                            finish()
                        }
                        .addOnFailureListener { fsError ->
                            saveUserPreferences(name, phone)
                            setLoading(false)
                            // Pendaftaran Auth tetap berhasil meski Firestore offline
                            Toast.makeText(this, "Akun berhasil dibuat! Selamat datang, $name.", Toast.LENGTH_LONG).show()
                            finish()
                        }
                }
                .addOnFailureListener { e ->
                    setLoading(false)
                    val friendlyMsg = when (e) {
                        is FirebaseAuthWeakPasswordException -> "Kata sandi terlalu lemah (minimal 6 karakter)."
                        is FirebaseAuthUserCollisionException -> "Email ini sudah terdaftar. Silakan gunakan menu Masuk."
                        is FirebaseAuthInvalidCredentialsException -> "Format email tidak valid."
                        else -> e.localizedMessage ?: "Gagal mendaftar. Silakan coba kembali."
                    }
                    Toast.makeText(this, friendlyMsg, Toast.LENGTH_LONG).show()
                }
        }
    }

    private fun validateLoginForm(email: String, pass: String): Boolean {
        if (email.isEmpty()) {
            binding.etLoginEmail.error = "Email wajib diisi"
            binding.etLoginEmail.requestFocus()
            return false
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.etLoginEmail.error = "Format email tidak valid"
            binding.etLoginEmail.requestFocus()
            return false
        }
        if (pass.isEmpty()) {
            binding.etLoginPassword.error = "Kata sandi wajib diisi"
            binding.etLoginPassword.requestFocus()
            return false
        }
        return true
    }

    private fun validateRegisterForm(name: String, phone: String, email: String, pass: String, confirm: String): Boolean {
        if (name.isEmpty()) {
            binding.etRegisterName.error = "Nama lengkap wajib diisi"
            binding.etRegisterName.requestFocus()
            return false
        }
        if (phone.isEmpty()) {
            binding.etRegisterPhone.error = "Nomor HP/WhatsApp wajib diisi"
            binding.etRegisterPhone.requestFocus()
            return false
        }
        if (email.isEmpty()) {
            binding.etRegisterEmail.error = "Email wajib diisi"
            binding.etRegisterEmail.requestFocus()
            return false
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.etRegisterEmail.error = "Format email tidak valid"
            binding.etRegisterEmail.requestFocus()
            return false
        }
        if (pass.length < 6) {
            binding.etRegisterPassword.error = "Kata sandi minimal 6 karakter"
            binding.etRegisterPassword.requestFocus()
            return false
        }
        if (pass != confirm) {
            binding.etRegisterConfirmPassword.error = "Konfirmasi kata sandi tidak cocok"
            binding.etRegisterConfirmPassword.requestFocus()
            return false
        }
        return true
    }

    private fun saveUserPreferences(name: String, phone: String) {
        val prefs = getSharedPreferences(CheckoutActivity.PREFS_NAME, MODE_PRIVATE)
        prefs.edit()
            .putString(CheckoutActivity.KEY_NAME, name)
            .putString(CheckoutActivity.KEY_PHONE, phone)
            .apply()
    }

    private fun setLoading(isLoading: Boolean) {
        binding.pbAuthLoading.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.btnSubmitLogin.isEnabled = !isLoading
        binding.btnSubmitRegister.isEnabled = !isLoading
        binding.btnTabLogin.isEnabled = !isLoading
        binding.btnTabRegister.isEnabled = !isLoading
    }
}
