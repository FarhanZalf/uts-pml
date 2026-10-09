package farhan.zalfanudin.uts

import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import farhan.zalfanudin.uts.databinding.ActivityProductDetailBinding
import java.text.NumberFormat
import java.util.Locale

class ProductDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProductDetailBinding

    private var productId: Int = 0
    private var productName: String = ""
    private var productPrice: Double = 0.0
    private var productStock: Int = 0
    private var quantity: Int = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        binding = ActivityProductDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Status bar icon gelap agar jelas terlihat
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true

        // Window insets agar header tidak ketutup status bar dan bottomBar tidak ketutup gestur HP
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.headerBar.setPadding(12, systemBars.top, 16, 0)
            binding.bottomBar.setPadding(16, 12, 16, systemBars.bottom + 12)
            insets
        }

        extractIntentData()
        setupViews()
        setupListeners()
    }

    private fun extractIntentData() {
        productId = intent.getIntExtra(EXTRA_ID, 0)
        productName = intent.getStringExtra(EXTRA_NAME) ?: "Produk Roti"
        val category = intent.getStringExtra(EXTRA_CATEGORY) ?: "Bakery"
        productPrice = intent.getDoubleExtra(EXTRA_PRICE, 0.0)
        productStock = intent.getIntExtra(EXTRA_STOCK, 1)
        val description = intent.getStringExtra(EXTRA_DESCRIPTION) ?: ""
        val imageRes = intent.getIntExtra(EXTRA_IMAGE_RES, R.drawable.ic_bakery_item)

        binding.tvDetailName.text = productName
        binding.tvDetailCategory.text = category
        binding.tvDetailStock.text = "Stok: $productStock"
        binding.tvDetailPrice.text = "${formatRupiah(productPrice)} / pcs"
        binding.tvDetailDescription.text = description
        binding.ivDetailProduct.setImageResource(imageRes)

        updateSubtotal()
    }

    private fun setupViews() {
        binding.tvQuantity.text = quantity.toString()
    }

    private fun setupListeners() {
        // Tombol Kembali
        binding.btnBack.setOnClickListener {
            finish()
        }

        // Tombol Minus
        binding.btnMinus.setOnClickListener {
            if (quantity > 1) {
                quantity--
                binding.tvQuantity.text = quantity.toString()
                updateSubtotal()
            }
        }

        // Tombol Plus
        binding.btnPlus.setOnClickListener {
            if (quantity < productStock) {
                quantity++
                binding.tvQuantity.text = quantity.toString()
                updateSubtotal()
            } else {
                Toast.makeText(this, "Maksimal stok tercapai ($productStock)", Toast.LENGTH_SHORT).show()
            }
        }

        // Tombol Tambah ke Keranjang
        binding.btnAddToCart.setOnClickListener {
            Toast.makeText(
                this,
                "$quantity x $productName berhasil ditambahkan ke keranjang!",
                Toast.LENGTH_SHORT
            ).show()
            finish()
        }
    }

    private fun updateSubtotal() {
        val total = productPrice * quantity
        binding.tvSubtotal.text = formatRupiah(total)
    }

    private fun formatRupiah(amount: Double): String {
        return "Rp " + NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount.toLong())
    }

    companion object {
        const val EXTRA_ID = "extra_id"
        const val EXTRA_NAME = "extra_name"
        const val EXTRA_CATEGORY = "extra_category"
        const val EXTRA_PRICE = "extra_price"
        const val EXTRA_STOCK = "extra_stock"
        const val EXTRA_DESCRIPTION = "extra_description"
        const val EXTRA_IMAGE_RES = "extra_image_res"
    }
}
