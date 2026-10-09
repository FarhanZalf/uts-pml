package farhan.zalfanudin.uts

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.fragment.app.Fragment
import farhan.zalfanudin.uts.data.CartDatabaseHelper
import farhan.zalfanudin.uts.databinding.ActivityMainBinding
import java.net.URLEncoder

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cartDbHelper: CartDatabaseHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cartDbHelper = CartDatabaseHelper(this)

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
    }

    override fun onResume() {
        super.onResume()
        updateCartBadge()
    }

    // --- IMPLEMENTASI OPTIONSMENU (Poin Penilaian Dosen #10: OptionsMenu 1%) ---

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_options_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
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
            R.id.action_refresh -> {
                refreshCurrentFragment()
                Toast.makeText(this, "Halaman berhasil disegarkan", Toast.LENGTH_SHORT).show()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
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
}