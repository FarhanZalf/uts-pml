package farhan.zalfanudin.uts

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.fragment.app.Fragment
import com.google.firebase.auth.FirebaseAuth
import farhan.zalfanudin.uts.data.CartDatabaseHelper
import farhan.zalfanudin.uts.databinding.ActivityMainBinding
import farhan.zalfanudin.uts.firebase.ErlesFirebaseMessagingService
import java.net.URLEncoder

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cartDbHelper: CartDatabaseHelper

    private val requestNotificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Toast.makeText(this, "Notifikasi status pesanan diaktifkan", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cartDbHelper = CartDatabaseHelper(this)

        // Setup notification channel (LANGKAH 5)
        ErlesFirebaseMessagingService.createNotificationChannel(this)
        checkNotificationPermission()

        // 1. Setup Toolbar & OptionsMenu (Poin Penilaian Dosen: OptionsMenu)
        setSupportActionBar(binding.topToolbar)

        // Pastikan status bar (jam, baterai) terlihat jelas dengan warna gelap di atas background terang
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true

        // Tangani ukuran layar HP (Window Insets)
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.topToolbar.setPadding(0, systemBars.top, 0, 0)
            binding.bottomNav.setPadding(0, 0, 0, systemBars.bottom)
            insets
        }

        // Tampilkan fragment default saat aplikasi pertama kali dibuka (Menu Katalog)
        if (savedInstanceState == null) {
            loadFragment(MenuFragment())
        }

        // Listener klik BottomNavigationView untuk berganti fragment (Poin: BottomNavigationView & FrameLayout)
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_menu -> {
                    loadFragment(MenuFragment())
                    true
                }
                R.id.nav_cart -> {
                    loadFragment(CartFragment())
                    true
                }
                R.id.nav_track -> {
                    loadFragment(TrackingFragment())
                    true
                }
                else -> false
            }
        }

        // Perbarui badge angka pada ikon keranjang saat pertama kali dibuka
        updateCartBadge()

        // Tangani intent jika aplikasi dibuka dari ketukan notifikasi FCM (LANGKAH 5)
        handleNotificationIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleNotificationIntent(intent)
    }

    private fun handleNotificationIntent(intent: Intent?) {
        val orderCode = intent?.getStringExtra(EXTRA_ORDER_CODE)
            ?: intent?.getStringExtra("kode_pesanan")
        val openTrack = intent?.getBooleanExtra(EXTRA_OPEN_TRACK, false) ?: false

        if (!orderCode.isNullOrEmpty() || openTrack) {
            binding.bottomNav.selectedItemId = R.id.nav_track
            val trackingFrag = if (!orderCode.isNullOrEmpty()) {
                TrackingFragment.newInstance(orderCode)
            } else {
                TrackingFragment()
            }
            loadFragment(trackingFrag)
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                if (shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
                    AlertDialog.Builder(this)
                        .setTitle("Notifikasi Status Pesanan")
                        .setMessage("Aktifkan notifikasi agar Anda mendapatkan kabar langsung saat roti mulai diproses atau siap diambil.")
                        .setPositiveButton("Izinkan") { _, _ ->
                            requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                        .setNegativeButton("Nanti Saja", null)
                        .show()
                } else {
                    requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updateCartBadge()
        invalidateOptionsMenu()
        PromoTrigger.fire(this)
    }

    // --- IMPLEMENTASI OPTIONSMENU (Poin Penilaian Dosen #10: OptionsMenu 1%) ---

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_options_menu, menu)
        return true
    }

    override fun onPrepareOptionsMenu(menu: Menu?): Boolean {
        val authItem = menu?.findItem(R.id.action_auth)
        val currentUser = FirebaseAuth.getInstance().currentUser
        if (currentUser != null) {
            val nameOrEmail = currentUser.displayName ?: currentUser.email?.substringBefore("@") ?: "Pelanggan"
            authItem?.title = "👤 $nameOrEmail (Keluar)"
        } else {
            authItem?.title = "🔑 Masuk / Daftar Akun"
        }
        return super.onPrepareOptionsMenu(menu)
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.action_auth -> {
                val currentUser = FirebaseAuth.getInstance().currentUser
                if (currentUser != null) {
                    showLogoutConfirmationDialog(currentUser.displayName ?: currentUser.email ?: "Pengguna")
                } else {
                    startActivity(Intent(this, AuthActivity::class.java))
                }
                return true
            }
            R.id.action_about -> {
                showAboutDialog()
                return true
            }
            R.id.action_contact_wa -> {
                openWhatsAppSupport()
                return true
            }
            R.id.action_help -> {
                showHelpDialog()
                return true
            }
            R.id.action_server_settings -> {
                showServerSettingsDialog()
                return true
            }
            R.id.action_refresh -> {
                refreshCurrentFragment()
                Toast.makeText(this, "Halaman berhasil disegarkan", Toast.LENGTH_SHORT).show()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    private fun showServerSettingsDialog() {
        val currentUrl = farhan.zalfanudin.uts.network.ApiConfig.getBaseUrl(this)

        val input = android.widget.EditText(this).apply {
            setText(currentUrl)
            setSelection(text.length)
            setSingleLine(true)
            val padding = (14 * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)
            setBackgroundResource(R.drawable.bg_search_bar)
        }

        val container = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            val pad = (20 * resources.displayMetrics.density).toInt()
            setPadding(pad, 12, pad, 12)
            addView(android.widget.TextView(this@MainActivity).apply {
                text = "Pilih atau masukkan alamat URL Backend REST API:\n\n• USB Kabel / ADB Wireless:\n  http://127.0.0.1:8000/api\n\n• Wi-Fi LAN Laptop:\n  http://192.168.1.78:8000/api"
                textSize = 12f
                setTextColor(androidx.core.content.ContextCompat.getColor(this@MainActivity, R.color.text_secondary))
                setPadding(0, 0, 0, (10 * resources.displayMetrics.density).toInt())
            })
            addView(input)
        }

        AlertDialog.Builder(this)
            .setTitle("⚙️ Pengaturan Server API")
            .setView(container)
            .setPositiveButton("Simpan") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    farhan.zalfanudin.uts.network.ApiConfig.setBaseUrl(this, newUrl)
                    Toast.makeText(this, "Alamat Server disimpan:\n$newUrl", Toast.LENGTH_LONG).show()
                    refreshCurrentFragment()
                }
            }
            .setNeutralButton("Reset Default") { _, _ ->
                farhan.zalfanudin.uts.network.ApiConfig.setBaseUrl(this, farhan.zalfanudin.uts.network.ApiConfig.DEFAULT_BASE_URL)
                Toast.makeText(this, "Server direset ke:\n${farhan.zalfanudin.uts.network.ApiConfig.DEFAULT_BASE_URL}", Toast.LENGTH_SHORT).show()
                refreshCurrentFragment()
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun showLogoutConfirmationDialog(userName: String) {
        AlertDialog.Builder(this)
            .setTitle("Keluar dari Akun")
            .setMessage("Apakah Anda yakin ingin keluar dari akun $userName?\n(Anda tetap dapat menjelajah menu dan memesan sebagai tamu).")
            .setPositiveButton("Keluar") { _, _ ->
                FirebaseAuth.getInstance().signOut()
                invalidateOptionsMenu()
                Toast.makeText(this, "Berhasil keluar dari akun", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun showAboutDialog() {
        val info = """
            🍰 Erles Bakery Publik
            Aplikasi Pemesanan Roti & Kue Pelanggan
            
            👤 Tim Pengembang:
            1. Mochamad Farhan Zalfanudin
            2. Chelsea Cinta An Anlisty
            
            🎓 Mata Kuliah: Pemrograman Mobile Lanjut (PML)
            👨‍🏫 Dosen Pengampu: Benni Agung Nugroho, S.Kom., M.Cs.
            📍 PSDKU Kota Kediri - Politeknik Negeri Malang
            
            Versi Aplikasi: 1.0 (UTS PML Edition)
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("Tentang Erles Bakery")
            .setMessage(info)
            .setPositiveButton("Tutup", null)
            .show()
    }

    private fun openWhatsAppSupport() {
        val message = "Halo CS Erles Bakery, saya ingin bertanya seputar pemesanan roti di aplikasi mobile."
        try {
            val encodedMsg = URLEncoder.encode(message, "UTF-8")
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=6281234567890&text=$encodedMsg")
            val intent = Intent(Intent.ACTION_VIEW, uri)
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(this, "Aplikasi WhatsApp tidak terpasang di perangkat", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showHelpDialog() {
        val help = """
            🥖 Panduan Memesan di Erles Bakery:
            
            1. Pilih Produk: Telusuri roti di Tab Katalog, gunakan pencarian & filter kategori.
            2. Masukkan Keranjang: Atur jumlah roti dan masukkan ke keranjang.
            3. Lanjut ke Checkout: Isi nama, no WhatsApp, pilih ambil di toko atau diantar, lalu tentukan jam pengambilan.
            4. Dapatkan Kode Pesanan & QR Tiket: Buka Tab Lacak untuk melihat status pesanan dan scan tiket di kasir!
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("Panduan Pemesanan")
            .setMessage(help)
            .setPositiveButton("Mengerti", null)
            .show()
    }

    private fun refreshCurrentFragment() {
        updateCartBadge()
        val currentFragment = supportFragmentManager.findFragmentById(R.id.fragment_container)
        if (currentFragment != null) {
            supportFragmentManager.beginTransaction()
                .detach(currentFragment)
                .attach(currentFragment)
                .commit()
        }
    }

    // Fungsi memperbarui badge angka notifikasi (1, 2, ...) di ikon Keranjang
    fun updateCartBadge() {
        val totalCount = cartDbHelper.getTotalItemCount()
        val badge = binding.bottomNav.getOrCreateBadge(R.id.nav_cart)
        if (totalCount > 0) {
            badge.isVisible = true
            badge.number = totalCount
            badge.backgroundColor = getColor(R.color.primary_dark)
            badge.badgeTextColor = getColor(R.color.white)
        } else {
            badge.isVisible = false
            badge.clearNumber()
        }
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
    }

    companion object {
        const val EXTRA_ORDER_CODE = "EXTRA_ORDER_CODE"
        const val EXTRA_OPEN_TRACK = "EXTRA_OPEN_TRACK"
    }
}