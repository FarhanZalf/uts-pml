package farhan.zalfanudin.uts

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import farhan.zalfanudin.uts.data.CartDatabaseHelper
import farhan.zalfanudin.uts.databinding.ActivityCheckoutBinding
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class CheckoutActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCheckoutBinding
    private lateinit var cartDbHelper: CartDatabaseHelper
    private lateinit var sharedPreferences: SharedPreferences

    private var subtotal: Double = 0.0
    private var extraFee: Double = 0.0
    private var grandTotal: Double = 0.0

    private var selectedDateStr: String = ""
    private var selectedTimeStr: String = ""

    companion object {
        private const val PREFS_NAME = "erles_customer_prefs"
        private const val KEY_NAME = "pref_customer_name"
        private const val KEY_PHONE = "pref_customer_phone"

        private const val FEE_GREETING_CARD = 5000.0
        private const val FEE_CANDLES = 3000.0
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        binding = ActivityCheckoutBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cartDbHelper = CartDatabaseHelper(this)
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // Status bar icon gelap agar kontras
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true

        // Penanganan Window Insets (Status bar & Bottom navigation gesture)
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.headerCheckout.setPadding(12, systemBars.top, 16, 0)
            binding.bottomCheckoutBar.setPadding(16, 12, 16, systemBars.bottom + 12)
            insets
        }

        loadCustomerFromPreferences()
        setupDeliveryRadioGroup()
        setupDateTimePickers()
        setupExtraCheckboxes()
        calculateTotals()
        setupSubmitButton()

        binding.btnCheckoutBack.setOnClickListener {
            finish()
        }
    }

    // 1. SharedPreferences: Mengisi nama & nomor HP otomatis jika sudah pernah memesan
    private fun loadCustomerFromPreferences() {
        val savedName = sharedPreferences.getString(KEY_NAME, "")
        val savedPhone = sharedPreferences.getString(KEY_PHONE, "")

        if (!savedName.isNullOrEmpty()) {
            binding.etCustomerName.setText(savedName)
        }
        if (!savedPhone.isNullOrEmpty()) {
            binding.etCustomerPhone.setText(savedPhone)
        }
    }

    // 2. RadioButton: Logika Ambil di Toko vs Diantar ke Rumah
    private fun setupDeliveryRadioGroup() {
        binding.rgDeliveryMethod.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId == R.id.rbPickup) {
                binding.tvAddressLabel.text = "Lokasi Pengambilan"
                binding.etCustomerAddress.setText("Outlet Erles Bakery - Jl. Mayor Bismo No. 27 Kediri")
                binding.etCustomerAddress.isEnabled = false
            } else {
                binding.tvAddressLabel.text = "Alamat Pengantaran *"
                binding.etCustomerAddress.setText("")
                binding.etCustomerAddress.hint = "Masukkan alamat jalan, nomor rumah, RT/RW..."
                binding.etCustomerAddress.isEnabled = true
            }
        }
    }

    // 3. DatePickerDialog & TimePickerDialog: Pemilihan Waktu Pengambilan
    private fun setupDateTimePickers() {
        // Pemilihan Tanggal
        binding.layoutPickDate.setOnClickListener {
            val calendar = Calendar.getInstance()
            val year = calendar.get(Calendar.YEAR)
            val month = calendar.get(Calendar.MONTH)
            val day = calendar.get(Calendar.DAY_OF_MONTH)

            val datePicker = DatePickerDialog(
                this,
                { _, selectedYear, selectedMonth, selectedDay ->
                    val chosenCal = Calendar.getInstance().apply {
                        set(selectedYear, selectedMonth, selectedDay)
                    }
                    val sdf = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.forLanguageTag("id-ID"))
                    selectedDateStr = sdf.format(chosenCal.time)
                    binding.tvSelectedDate.text = selectedDateStr
                },
                year, month, day
            )
            // Batasi tanggal minimal hari ini
            datePicker.datePicker.minDate = System.currentTimeMillis() - 1000
            datePicker.show()
        }

        // Pemilihan Jam
        binding.layoutPickTime.setOnClickListener {
            val calendar = Calendar.getInstance()
            val hour = calendar.get(Calendar.HOUR_OF_DAY)
            val minute = calendar.get(Calendar.MINUTE)

            val timePicker = TimePickerDialog(
                this,
                { _, selectedHour, selectedMinute ->
                    selectedTimeStr = String.format(Locale.getDefault(), "%02d:%02d WIB", selectedHour, selectedMinute)
                    binding.tvSelectedTime.text = selectedTimeStr
                },
                hour, minute, true
            )
            timePicker.show()
        }
    }

    // 4. CheckBox: Menghitung Biaya Tambahan
    private fun setupExtraCheckboxes() {
        val checkListener = {
            extraFee = 0.0
            if (binding.cbGreetingCard.isChecked) {
                extraFee += FEE_GREETING_CARD
            }
            if (binding.cbCandles.isChecked) {
                extraFee += FEE_CANDLES
            }
            updateTotalViews()
        }

        binding.cbGreetingCard.setOnCheckedChangeListener { _, _ -> checkListener() }
        binding.cbCandles.setOnCheckedChangeListener { _, _ -> checkListener() }
    }

    private fun calculateTotals() {
        subtotal = cartDbHelper.getTotalPrice()
        updateTotalViews()
    }

    private fun updateTotalViews() {
        grandTotal = subtotal + extraFee
        binding.tvCheckoutSubtotal.text = formatRupiah(subtotal)
        binding.tvCheckoutExtra.text = formatRupiah(extraFee)
        binding.tvCheckoutGrandTotal.text = formatRupiah(grandTotal)
    }

    // 5. Validasi & Submit Pemesanan
    private fun setupSubmitButton() {
        binding.btnSubmitOrder.setOnClickListener {
            val name = binding.etCustomerName.text.toString().trim()
            val phone = binding.etCustomerPhone.text.toString().trim()
            val address = binding.etCustomerAddress.text.toString().trim()

            // Validasi Input
            if (name.isEmpty()) {
                binding.etCustomerName.error = "Nama pemesan wajib diisi"
                binding.etCustomerName.requestFocus()
                return@setOnClickListener
            }
            if (phone.isEmpty()) {
                binding.etCustomerPhone.error = "Nomor WhatsApp wajib diisi"
                binding.etCustomerPhone.requestFocus()
                return@setOnClickListener
            }
            if (binding.rbDelivery.isChecked && address.isEmpty()) {
                binding.etCustomerAddress.error = "Alamat pengantaran wajib diisi"
                binding.etCustomerAddress.requestFocus()
                return@setOnClickListener
            }
            if (selectedDateStr.isEmpty()) {
                Toast.makeText(this, "Silakan pilih tanggal pengambilan terlebih dahulu", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (selectedTimeStr.isEmpty()) {
                Toast.makeText(this, "Silakan pilih jam pengambilan terlebih dahulu", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Simpan Nama & Nomor HP ke SharedPreferences untuk transaksi berikutnya
            sharedPreferences.edit()
                .putString(KEY_NAME, name)
                .putString(KEY_PHONE, phone)
                .apply()

            // Buat Kode Pesanan Resmi Kanonikal sesuai backend: ORD-{YYYYMMDD}-{XXXX}
            val dateCode = SimpleDateFormat("yyyyMMdd", Locale.getDefault()).format(Calendar.getInstance().time)
            val randomSeq = String.format(Locale.getDefault(), "%04d", (1..9999).random())
            val orderCode = "ORD-$dateCode-$randomSeq"

            // Simpan pesanan ke database SQLite lokal (tabel orders_history)
            val notes = binding.etOrderNotes.text.toString().trim()
            val newOrder = farhan.zalfanudin.uts.model.Order(
                orderCode = orderCode,
                customerName = name,
                customerPhone = phone,
                address = if (binding.rbPickup.isChecked) "Outlet Erles Bakery - Jl. Mayor Bismo No. 27 Kediri" else address,
                notes = notes,
                pickupDate = "$selectedDateStr ($selectedTimeStr)",
                totalPrice = grandTotal,
                status = "pending",
                createdAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Calendar.getInstance().time)
            )
            cartDbHelper.saveOrder(newOrder)

            // Tampilkan Dialog Sukses
            showOrderSuccessDialog(orderCode, name)
        }
    }

    private fun showOrderSuccessDialog(orderCode: String, customerName: String) {
        val message = """
            Terima kasih, Kak $customerName!
            Pesanan roti Anda telah berhasil dibuat.
            
            Kode Pesanan: $orderCode
            Jadwal: $selectedDateStr ($selectedTimeStr)
            Total: ${formatRupiah(grandTotal)}
            
            Status: Menunggu Konfirmasi (Pending)
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("Pesanan Berhasil Dibuat!")
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("Lihat Pesanan") { _, _ ->
                // Kosongkan keranjang belanja setelah sukses pesan
                cartDbHelper.clearCart()
                Toast.makeText(this, "Pesanan berhasil dicatat & keranjang telah dikosongkan", Toast.LENGTH_SHORT).show()
                finish()
            }
            .show()
    }

    private fun formatRupiah(amount: Double): String {
        return "Rp " + NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount.toLong())
    }
}
