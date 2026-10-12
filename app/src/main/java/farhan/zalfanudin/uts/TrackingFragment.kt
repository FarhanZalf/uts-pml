package farhan.zalfanudin.uts

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Geocoder
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import farhan.zalfanudin.uts.data.CartDatabaseHelper
import farhan.zalfanudin.uts.databinding.FragmentTrackBinding
import farhan.zalfanudin.uts.databinding.ItemOrderBinding
import farhan.zalfanudin.uts.model.Order
import farhan.zalfanudin.uts.util.QRCodeUtil
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline
import java.io.File
import java.net.URLEncoder
import java.text.NumberFormat
import java.util.Locale

class TrackingFragment : Fragment() {

    private var _binding: FragmentTrackBinding? = null
    private val binding get() = _binding!!

    private lateinit var cartDbHelper: CartDatabaseHelper
    private var currentDisplayedOrder: Order? = null
    private var firestoreListener: com.google.firebase.firestore.ListenerRegistration? = null

    // #20, #26 & #33: Pengambilan foto dari Kamera, Galeri dan Supabase Storage
    private var cameraPhotoUri: Uri? = null

    private val pickPaymentProofLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val order = currentDisplayedOrder
            if (order != null) {
                uploadProofToSupabase(uri, order)
            }
        }
    }

    private val takeCameraProofLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && cameraPhotoUri != null) {
            val order = currentDisplayedOrder
            if (order != null) {
                uploadProofToSupabase(cameraPhotoUri!!, order)
            }
        }
    }

    private val requestCameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            launchCamera()
        } else {
            Toast.makeText(
                requireContext(),
                "Izin kamera diperlukan untuk memotret bukti pembayaran.",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTrackBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        Configuration.getInstance().userAgentValue = requireContext().packageName
        cartDbHelper = CartDatabaseHelper(requireContext())

        setupListeners()
        loadData()
    }

    override fun onResume() {
        super.onResume()
        loadData()
    }

    private fun setupListeners() {
        // Interaksi klik kartu riwayat otomatis memuat pesanan ke tracker utama
    }

    private fun loadData() {
        val orders = cartDbHelper.getAllOrders()
        populateOrderHistoryList(orders)

        // Jika ada argumen orderCode dari notifikasi, utamakan pesanan tersebut
        val targetCode = arguments?.getString(ARG_ORDER_CODE)
        if (!targetCode.isNullOrEmpty()) {
            val targeted = cartDbHelper.getOrderByCode(targetCode)
            if (targeted != null) {
                displayOrderDetail(targeted)
                return
            }
        }

        if (orders.isEmpty()) {
            binding.cardTrackingDetail.visibility = View.GONE
            binding.layoutHistoryEmpty.visibility = View.VISIBLE
        } else {
            binding.layoutHistoryEmpty.visibility = View.GONE

            // Otomatis menampilkan pesanan paling baru jika belum ada yang dipilih
            if (currentDisplayedOrder == null) {
                displayOrderDetail(orders.first())
            } else {
                val refreshed = cartDbHelper.getOrderByCode(currentDisplayedOrder!!.orderCode)
                if (refreshed != null) {
                    displayOrderDetail(refreshed)
                } else {
                    displayOrderDetail(orders.first())
                }
            }
        }
    }

    // Menampilkan detail order, tahapan status timeline, dan diferensiasi Pickup vs Delivery
    private fun displayOrderDetail(order: Order) {
        currentDisplayedOrder = order
        binding.cardTrackingDetail.visibility = View.VISIBLE

        binding.tvTrackDetailCode.text = order.orderCode
        binding.tvTrackDetailCustomer.text = "Pemesan: ${order.customerName} (${order.customerPhone})"
        binding.tvTrackDetailDate.text = "Jadwal: ${order.pickupDate}"
        binding.tvTrackDetailTotal.text = "Total Pembayaran: ${formatRupiah(order.totalPrice)}"

        if (order.notes.isNotEmpty()) {
            binding.tvTrackDetailNotes.visibility = View.VISIBLE
            binding.tvTrackDetailNotes.text = "Catatan Khusus: \"${order.notes}\""
        } else {
            binding.tvTrackDetailNotes.visibility = View.GONE
        }

        // DIFERENSIASI METODE PENGIRIMAN: Ambil di Toko (Pickup) vs Diantar Kurir (Delivery)
        if (order.isPickup) {
            // Mode Ambil Sendiri di Toko
            binding.tvTrackDeliveryMethod.text = "Ambil di Toko"
            binding.tvTrackDeliveryMethod.setBackgroundResource(R.drawable.bg_badge_category)
            binding.tvTrackDeliveryMethod.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_dark))
            binding.tvTrackDetailAddress.text = "Lokasi Pengambilan: Outlet Erles Bakery (Jl. Mayor Bismo No. 27 Kediri)"

            // Tampilkan QR Code untuk kasir toko
            binding.layoutQrCodeContainer.visibility = View.VISIBLE
            binding.layoutDeliveryInfoContainer.visibility = View.GONE

            val qrBitmap = QRCodeUtil.generateQRCode(order.orderCode, 450)
            if (qrBitmap != null) {
                binding.ivOrderQrCode.setImageBitmap(qrBitmap)
            }

            binding.btnViewBakeryLocation.setOnClickListener {
                showBakeryLocationMapDialog()
            }

            binding.btnContactKasirWa.text = "Hubungi Kasir Toko via WhatsApp"
        } else {
            // Mode Diantar Kurir
            binding.tvTrackDeliveryMethod.text = "Diantar Kurir"
            binding.tvTrackDeliveryMethod.setBackgroundResource(R.drawable.bg_badge_process)
            binding.tvTrackDeliveryMethod.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_blue))
            binding.tvTrackDetailAddress.text = "Alamat Pengantaran: ${order.address}"

            // Sembunyikan QR Code tiket kasir (tidak relevan untuk kurir), tampilkan info pengantaran
            binding.layoutQrCodeContainer.visibility = View.GONE
            binding.layoutDeliveryInfoContainer.visibility = View.VISIBLE
            binding.tvDeliveryHomeAddress.text = "Alamat Tujuan: ${order.address}"

            binding.btnViewDeliveryRoute.setOnClickListener {
                showDeliveryRouteMapDialog(order)
            }

            binding.btnContactKasirWa.text = "Hubungi Kurir / CS via WhatsApp"
        }

        // Jika pesanan sudah dibatalkan, sembunyikan QR Code kasir dan info pengantaran
        val statusClean = order.status.lowercase(Locale.getDefault())
        if (statusClean == "dibatalkan" || statusClean == "cancelled") {
            binding.layoutQrCodeContainer.visibility = View.GONE
            binding.layoutDeliveryInfoContainer.visibility = View.GONE
        }

        // Tampilan Badge & Timeline Stepper sesuai status dan metode
        updateStatusViews(order)

        // Tampilan Status & Aksi Pembayaran (QRIS, Transfer BCA, Tunai)
        updatePaymentViews(order)

        binding.btnPayOrder.setOnClickListener {
            showPaymentDialog(order)
        }

        // #20, #26 & #33: Pengambilan foto dari Kamera, Galeri dan Supabase Storage
        binding.btnUploadPaymentProof.setOnClickListener {
            showUploadProofSourceDialog(order)
        }

        // Tombol Batalkan Pesanan: HANYA muncul jika status masih 'pending' (menunggu konfirmasi toko)
        if (statusClean == "pending") {
            binding.btnCancelOrder.visibility = View.VISIBLE
            binding.btnCancelOrder.setOnClickListener {
                showCancelOrderConfirmationDialog(order)
            }
        } else {
            binding.btnCancelOrder.visibility = View.GONE
        }

        // Tombol WhatsApp Kasir / Kurir (Implicit Intent)
        binding.btnContactKasirWa.setOnClickListener {
            openWhatsAppChat(order)
        }

        // Subscribe ke topic FCM saat layar pelacakan dibuka (LANGKAH 5)
        com.google.firebase.messaging.FirebaseMessaging.getInstance()
            .subscribeToTopic("order_${order.orderCode}")

        // #18 & #19: Sinkronisasi status pesanan terbaru dari Web Admin ERP via Volley
        syncOrderWithServer(order.orderCode)

        // Pasang Snapshot Listener Firestore realtime (LANGKAH 4)
        listenToOrderStatusRealtime(order.orderCode)
    }

    private fun updatePaymentViews(order: Order) {
        if (order.isPaid) {
            binding.tvTrackPaymentBadge.text = "LUNAS ✓"
            binding.tvTrackPaymentBadge.setBackgroundResource(R.drawable.bg_badge_success)
            binding.tvTrackPaymentBadge.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_green))

            binding.btnPayOrder.visibility = View.GONE
            binding.layoutPaymentPaidNotice.visibility = View.VISIBLE
            binding.btnUploadPaymentProof.text = "Ganti Bukti Transfer (Kamera / Galeri)"
        } else {
            val statusClean = order.paymentStatus.lowercase(Locale.getDefault())
            if (statusClean == "partial" || statusClean == "sebagian") {
                binding.tvTrackPaymentBadge.text = "Sebagian (DP)"
                binding.tvTrackPaymentBadge.setBackgroundResource(R.drawable.bg_badge_pending)
                binding.tvTrackPaymentBadge.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_amber))
            } else {
                binding.tvTrackPaymentBadge.text = "Belum Dibayar"
                binding.tvTrackPaymentBadge.setBackgroundResource(R.drawable.bg_badge_pending)
                binding.tvTrackPaymentBadge.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_red))
            }

            binding.btnPayOrder.visibility = View.VISIBLE
            binding.btnPayOrder.text = "Bayar Sekarang (QRIS / Transfer BCA)"
            binding.layoutPaymentPaidNotice.visibility = View.GONE
            binding.btnUploadPaymentProof.text = "Unggah Bukti Transfer (Kamera / Galeri)"
        }
    }

    // #20 & #26: Dialog Pemilihan Sumber Kamera HP atau Galeri
    private fun showUploadProofSourceDialog(order: Order) {
        val options = arrayOf(
            "Ambil Foto Struk (Kamera HP)",
            "Pilih dari Galeri HP (Screenshot / File)"
        )
        AlertDialog.Builder(requireContext())
            .setTitle("Pilih Sumber Bukti Pembayaran")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        // #20: Kamera Langsung
                        if (ContextCompat.checkSelfPermission(
                                requireContext(),
                                Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                        ) {
                            launchCamera()
                        } else {
                            requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                        }
                    }
                    1 -> {
                        // #26: Galeri HP
                        pickPaymentProofLauncher.launch("image/*")
                    }
                }
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    // #20: Meluncurkan Kamera HP dengan FileProvider
    private fun launchCamera() {
        try {
            val context = requireContext()
            val photoFile = File(context.cacheDir, "bukti_transfer_camera_${System.currentTimeMillis()}.jpg")
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                photoFile
            )
            cameraPhotoUri = uri
            takeCameraProofLauncher.launch(uri)
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Gagal membuka kamera: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    // #33, #20 & #26: Mengunggah file struk/bukti bayar ke Supabase Storage
    private fun uploadProofToSupabase(uri: Uri, order: Order) {
        farhan.zalfanudin.uts.util.SupabaseStorageUtil.uploadPaymentProof(
            context = requireContext(),
            imageUri = uri,
            orderCode = order.orderCode,
            onStart = {
                binding.pbUploadProof.visibility = View.VISIBLE
                binding.btnUploadPaymentProof.isEnabled = false
                binding.btnUploadPaymentProof.text = "Mengunggah ke Supabase..."
            },
            onSuccess = { publicUrl, bitmap ->
                if (_binding == null || !isAdded) return@uploadPaymentProof
                binding.pbUploadProof.visibility = View.GONE
                binding.btnUploadPaymentProof.isEnabled = true
                binding.btnUploadPaymentProof.text = "Ganti Bukti Transfer (Kamera / Galeri)"

                // Tampilkan foto pratinjau struk transfer
                binding.layoutProofPreview.visibility = View.VISIBLE
                binding.ivProofThumbnail.setImageBitmap(bitmap)
                binding.tvProofStatus.text = "Bukti Tersimpan di Supabase:\n$publicUrl"

                // Update status pembayaran lokal di SQLite
                cartDbHelper.updateOrderPaymentStatus(order.orderCode, "paid")

                // Sinkronkan URL bukti pembayaran & status ke Cloud Firestore
                try {
                    com.google.firebase.firestore.FirebaseFirestore.getInstance()
                        .collection("order_status").document(order.orderCode)
                        .update(
                            mapOf(
                                "payment_status" to "paid",
                                "payment_proof_url" to publicUrl,
                                "updated_at" to java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply {
                                    timeZone = java.util.TimeZone.getTimeZone("UTC")
                                }.format(java.util.Date())
                            )
                        )
                } catch (_: Exception) {}

                Toast.makeText(requireContext(), "Bukti transfer berhasil diunggah ke Supabase Storage!", Toast.LENGTH_LONG).show()

                val refreshed = cartDbHelper.getOrderByCode(order.orderCode)
                if (refreshed != null) {
                    currentDisplayedOrder = refreshed
                    updatePaymentViews(refreshed)
                    populateOrderHistoryList(cartDbHelper.getAllOrders())
                }
            },
            onError = { errorMsg, fallbackBitmap ->
                if (_binding == null || !isAdded) return@uploadPaymentProof
                binding.pbUploadProof.visibility = View.GONE
                binding.btnUploadPaymentProof.isEnabled = true
                binding.btnUploadPaymentProof.text = "Ganti Bukti Transfer (Kamera / Galeri)"

                if (fallbackBitmap != null) {
                    // Tampilkan pratinjau foto secara lokal
                    binding.layoutProofPreview.visibility = View.VISIBLE
                    binding.ivProofThumbnail.setImageBitmap(fallbackBitmap)
                    binding.tvProofStatus.text = "Bukti Tersimpan di Perangkat (Lokal):\n$errorMsg"

                    // Tetap perbarui status pembayaran lokal di SQLite
                    cartDbHelper.updateOrderPaymentStatus(order.orderCode, "paid")

                    val refreshed = cartDbHelper.getOrderByCode(order.orderCode)
                    if (refreshed != null) {
                        currentDisplayedOrder = refreshed
                        updatePaymentViews(refreshed)
                        populateOrderHistoryList(cartDbHelper.getAllOrders())
                    }
                    Toast.makeText(requireContext(), "Struk foto tersimpan di perangkat!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), errorMsg, Toast.LENGTH_LONG).show()
                }
            }
        )
    }

    private fun listenToOrderStatusRealtime(orderCode: String) {
        firestoreListener?.remove()
        firestoreListener = null

        val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
        firestoreListener = db.collection("order_status").document(orderCode)
            .addSnapshotListener { snapshot, error ->
                if (_binding == null || !isAdded) return@addSnapshotListener
                if (error != null) {
                    // Jika offline atau error, sembunyikan indikator realtime tanpa memutus tampilan API
                    binding.tvRealtimeIndicator.visibility = View.GONE
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    // Data berasal dari Firestore -> Tampilkan indikator kecil Realtime
                    binding.tvRealtimeIndicator.visibility = View.VISIBLE

                    val newStatus = snapshot.getString("status")
                    val newPaymentStatus = snapshot.getString("payment_status")

                    val statusChanged = !newStatus.isNullOrEmpty() && newStatus.lowercase(Locale.getDefault()) != currentDisplayedOrder?.status?.lowercase(Locale.getDefault())
                    val paymentChanged = !newPaymentStatus.isNullOrEmpty() && newPaymentStatus.lowercase(Locale.getDefault()) != currentDisplayedOrder?.paymentStatus?.lowercase(Locale.getDefault())

                    if (statusChanged || paymentChanged) {
                        // Jangan timpa status lokal jika lokal sudah lunas tetapi snapshot Firestore lama masih unpaid
                        if (currentDisplayedOrder?.isPaid == true && (newPaymentStatus == "unpaid" || newPaymentStatus == "belum bayar")) {
                            return@addSnapshotListener
                        }

                        cartDbHelper.updateOrderStatusAndPayment(orderCode, newStatus, newPaymentStatus)
                        val refreshed = cartDbHelper.getOrderByCode(orderCode)
                        if (refreshed != null) {
                            currentDisplayedOrder = refreshed
                            updateStatusViews(refreshed)
                            updatePaymentViews(refreshed)
                            populateOrderHistoryList(cartDbHelper.getAllOrders())
                        }
                    }
                } else {
                    // Dokumen belum ada di Firestore -> Sinkronkan otomatis ke Firestore order_status
                    val cur = currentDisplayedOrder
                    if (cur != null && cur.orderCode == orderCode) {
                        try {
                            val initialData = hashMapOf(
                                "kode_pesanan" to cur.orderCode,
                                "customer_name" to cur.customerName,
                                "customer_phone" to cur.customerPhone,
                                "status" to cur.status,
                                "payment_status" to cur.paymentStatus,
                                "payment_method" to cur.paymentMethod,
                                "total_price" to cur.totalPrice.toLong(),
                                "updated_at" to java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply { 
                                    timeZone = java.util.TimeZone.getTimeZone("UTC") 
                                }.format(java.util.Date())
                            )
                            db.collection("order_status").document(orderCode).set(initialData)
                        } catch (_: Exception) {}
                    }
                    binding.tvRealtimeIndicator.visibility = View.VISIBLE
                }
            }
    }

    private fun syncOrderWithServer(orderCode: String) {
        farhan.zalfanudin.uts.network.ApiService.trackOrder(
            context = requireContext(),
            orderCode = orderCode,
            onSuccess = { serverOrder ->
                if (_binding != null && isAdded) {
                    val currentStatus = currentDisplayedOrder?.status?.lowercase(Locale.getDefault())
                    val newStatus = serverOrder.status.lowercase(Locale.getDefault())

                    val currentPay = currentDisplayedOrder?.paymentStatus?.lowercase(Locale.getDefault())
                    val newPay = serverOrder.paymentStatus.lowercase(Locale.getDefault())

                    // Jika pesanan sudah dibayar di HP tapi server masih unpaid, sinkronkan otomatis ke server
                    if ((currentPay == "paid" || currentPay == "lunas") && (newPay == "unpaid" || newPay == "belum bayar")) {
                        farhan.zalfanudin.uts.network.ApiService.confirmPayment(
                            context = requireContext(),
                            orderCode = serverOrder.orderCode,
                            amount = serverOrder.totalPrice,
                            method = "qris",
                            onSuccess = { syncedOrder ->
                                if (_binding != null && isAdded) {
                                    cartDbHelper.updateOrderPaymentStatus(syncedOrder.orderCode, syncedOrder.paymentStatus)
                                    val refreshed = cartDbHelper.getOrderByCode(syncedOrder.orderCode) ?: syncedOrder
                                    currentDisplayedOrder = refreshed
                                    updatePaymentViews(refreshed)
                                    populateOrderHistoryList(cartDbHelper.getAllOrders())
                                }
                            },
                            onError = { /* Biarkan tetap tersimpan di lokal */ }
                        )
                        return@trackOrder
                    }

                    val statusChanged = currentStatus != newStatus
                    val paymentChanged = currentPay != newPay

                    if (statusChanged || paymentChanged) {
                        cartDbHelper.updateOrderStatusAndPayment(serverOrder.orderCode, serverOrder.status, serverOrder.paymentStatus)
                        val refreshed = cartDbHelper.getOrderByCode(serverOrder.orderCode) ?: serverOrder
                        currentDisplayedOrder = refreshed
                        updateStatusViews(refreshed)
                        updatePaymentViews(refreshed)
                        populateOrderHistoryList(cartDbHelper.getAllOrders())
                        Toast.makeText(
                            requireContext(),
                            "Status diperbarui oleh Web Admin: ${serverOrder.status.uppercase(Locale.getDefault())} (${serverOrder.paymentStatus.uppercase(Locale.getDefault())})",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            },
            onError = { _ ->
                // Jika offline atau server belum connect, tetap gunakan data lokal
            }
        )
    }

    private fun updateStatusViews(order: Order) {
        val statusClean = order.status.lowercase(Locale.getDefault())

        val colorAmber = ContextCompat.getColor(requireContext(), R.color.status_amber)
        val colorBlue = ContextCompat.getColor(requireContext(), R.color.status_blue)
        val colorGreen = ContextCompat.getColor(requireContext(), R.color.status_green)
        val colorMuted = ContextCompat.getColor(requireContext(), R.color.text_muted)
        val colorPrimary = ContextCompat.getColor(requireContext(), R.color.text_primary)

        val isPickup = order.isPickup

        when (statusClean) {
            "diproses", "processing", "confirmed" -> {
                binding.tvTrackDetailStatusBadge.text = "Sedang Diproses Dapur"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_process)
                binding.tvTrackDetailStatusBadge.setTextColor(colorBlue)

                // Step 1: Lewat
                binding.tvStep1Text.setTextColor(colorMuted)
                // Step 2: Aktif
                binding.tvStep2Text.setTextColor(colorPrimary)
                binding.tvStep2Text.text = "2. Roti Sedang Dipanggang & Dikemas (AKTIF)"
                binding.ivStep2Icon.setImageResource(R.drawable.ic_check_circle)
                // Step 3: Belum
                binding.tvStep3Text.setTextColor(colorMuted)
                binding.tvStep3Text.text = if (isPickup) "3. Roti Siap Diambil di Outlet Toko" else "3. Kurir Sedang Menuju Alamat Anda"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_bakery_item)
            }
            "siap", "ready" -> {
                binding.tvTrackDetailStatusBadge.text = if (isPickup) "Siap Diambil di Outlet" else "Kurir Sedang Mengantar"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_success)
                binding.tvTrackDetailStatusBadge.setTextColor(colorGreen)

                binding.tvStep1Text.setTextColor(colorMuted)
                binding.tvStep2Text.setTextColor(colorMuted)
                binding.tvStep2Text.text = "2. Roti Telah Selesai Dipanggang & Dikemas"
                binding.tvStep3Text.setTextColor(colorPrimary)
                binding.tvStep3Text.text = if (isPickup) "3. Roti Siap Diambil di Outlet Toko (AKTIF)" else "3. Kurir Sedang Menuju Alamat Anda (AKTIF)"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_check_circle)
            }
            "selesai", "completed" -> {
                binding.tvTrackDetailStatusBadge.text = "Pesanan Selesai"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_success)
                binding.tvTrackDetailStatusBadge.setTextColor(colorGreen)

                binding.tvStep1Text.setTextColor(colorMuted)
                binding.tvStep2Text.setTextColor(colorMuted)
                binding.tvStep2Text.text = "2. Roti Telah Selesai Dipanggang & Dikemas"
                binding.tvStep3Text.setTextColor(colorGreen)
                binding.tvStep3Text.text = if (isPickup) "3. Roti Telah Selesai Diambil di Kasir" else "3. Roti Telah Diterima Pelanggan di Rumah"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_check_circle)
            }
            "dibatalkan", "cancelled" -> {
                val colorRed = ContextCompat.getColor(requireContext(), R.color.status_red)
                binding.tvTrackDetailStatusBadge.text = "Pesanan Dibatalkan"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_cancelled)
                binding.tvTrackDetailStatusBadge.setTextColor(colorRed)

                binding.tvStep1Text.setTextColor(colorRed)
                binding.tvStep1Text.text = "1. Pesanan Dibatalkan oleh Pelanggan"
                binding.ivStep1Icon.setImageResource(R.drawable.ic_delete)

                binding.tvStep2Text.setTextColor(colorMuted)
                binding.tvStep2Text.text = "2. Pemrosesan Roti Dibatalkan Toko"
                binding.ivStep2Icon.setImageResource(R.drawable.ic_clock)

                binding.tvStep3Text.setTextColor(colorMuted)
                binding.tvStep3Text.text = "3. Transaksi Tidak Dilanjutkan"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_bakery_item)
            }
            else -> { // "pending"
                binding.tvTrackDetailStatusBadge.text = "Menunggu Konfirmasi"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_pending)
                binding.tvTrackDetailStatusBadge.setTextColor(colorAmber)

                binding.tvStep1Text.setTextColor(colorPrimary)
                binding.tvStep1Text.text = "1. Pesanan Diterima Toko (Menunggu Konfirmasi)"
                binding.ivStep1Icon.setImageResource(R.drawable.ic_check_circle)

                binding.tvStep2Text.setTextColor(colorMuted)
                binding.tvStep2Text.text = "2. Roti Sedang Dipanggang & Dikemas"
                binding.ivStep2Icon.setImageResource(R.drawable.ic_clock)

                binding.tvStep3Text.setTextColor(colorMuted)
                binding.tvStep3Text.text = if (isPickup) "3. Roti Siap Diambil di Outlet Toko" else "3. Kurir Sedang Menuju Alamat Anda"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_bakery_item)
            }
        }
    }

    private fun openWhatsAppChat(order: Order) {
        val message = if (order.isPickup) {
            "Halo Kasir Erles Bakery, saya ingin konfirmasi pesanan Ambil di Toko dengan kode ${order.orderCode} atas nama ${order.customerName}."
        } else {
            "Halo Kurir/CS Erles Bakery, saya ingin menanyakan jadwal pengantaran pesanan dengan kode ${order.orderCode} ke alamat ${order.address}."
        }

        try {
            val encodedMsg = URLEncoder.encode(message, "UTF-8")
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=6285717224420&text=$encodedMsg")
            val intent = Intent(Intent.ACTION_VIEW, uri)
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "Aplikasi WhatsApp tidak terpasang di perangkat", Toast.LENGTH_SHORT).show()
        }
    }

    // Dialog Konfirmasi Pembatalan Pesanan oleh Pembeli (Hanya saat status masih 'pending')
    private fun showCancelOrderConfirmationDialog(order: Order) {
        AlertDialog.Builder(requireContext())
            .setTitle("Batalkan Pesanan?")
            .setMessage("Apakah Anda yakin ingin membatalkan pesanan ${order.orderCode}?\n\nPembatalan hanya dapat dilakukan saat toko belum mulai memanggang roti.")
            .setIcon(R.drawable.ic_delete)
            .setPositiveButton("Ya, Batalkan Pesanan") { _, _ ->
                cartDbHelper.updateOrderStatus(order.orderCode, "dibatalkan")
                try {
                    com.google.firebase.firestore.FirebaseFirestore.getInstance()
                        .collection("order_status").document(order.orderCode)
                        .update("status", "dibatalkan")
                } catch (_: Exception) {}
                Toast.makeText(requireContext(), "Pesanan ${order.orderCode} berhasil dibatalkan", Toast.LENGTH_SHORT).show()

                val refreshed = cartDbHelper.getOrderByCode(order.orderCode)
                if (refreshed != null) {
                    displayOrderDetail(refreshed)
                }
                populateOrderHistoryList(cartDbHelper.getAllOrders())
            }
            .setNegativeButton("Kembali", null)
            .show()
    }

    // Mengisi daftar riwayat seluruh pesanan ke dalam container LinearLayout
    private fun populateOrderHistoryList(orders: List<Order>) {
        binding.layoutOrdersList.removeAllViews()

        if (orders.isEmpty()) {
            binding.tvHistoryHeaderCount.text = "Belum ada pesanan yang tersimpan."
            return
        }

        binding.tvHistoryHeaderCount.text = "${orders.size} pesanan tercatat di perangkat ini"

        val inflater = LayoutInflater.from(requireContext())
        for (order in orders) {
            val itemBinding = ItemOrderBinding.inflate(inflater, binding.layoutOrdersList, false)

            itemBinding.tvItemOrderCode.text = order.orderCode
            itemBinding.tvItemOrderCustomer.text = "Pemesan: ${order.customerName} • ${if (order.isPickup) "Ambil di Toko" else "Diantar Kurir"}"
            itemBinding.tvItemOrderDate.text = "Jadwal: ${order.pickupDate}"
            itemBinding.tvItemOrderTotal.text = formatRupiah(order.totalPrice)

            when (order.status.lowercase(Locale.getDefault())) {
                "diproses", "processing", "confirmed" -> {
                    itemBinding.tvItemOrderStatus.text = "Diproses"
                    itemBinding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_process)
                    itemBinding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_blue))
                }
                "siap", "ready" -> {
                    itemBinding.tvItemOrderStatus.text = if (order.isPickup) "Siap Diambil" else "Diantar Kurir"
                    itemBinding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_success)
                    itemBinding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_green))
                }
                "selesai", "completed" -> {
                    itemBinding.tvItemOrderStatus.text = "Selesai"
                    itemBinding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_success)
                    itemBinding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_green))
                }
                "dibatalkan", "cancelled" -> {
                    itemBinding.tvItemOrderStatus.text = "Dibatalkan"
                    itemBinding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_cancelled)
                    itemBinding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_red))
                }
                else -> {
                    itemBinding.tvItemOrderStatus.text = "Pending"
                    itemBinding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_pending)
                    itemBinding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_amber))
                }
            }

            if (order.isPaid) {
                itemBinding.tvItemOrderPaymentStatus.text = "Lunas ✓"
                itemBinding.tvItemOrderPaymentStatus.setBackgroundResource(R.drawable.bg_badge_success)
                itemBinding.tvItemOrderPaymentStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_green))
            } else {
                itemBinding.tvItemOrderPaymentStatus.text = "Belum Bayar"
                itemBinding.tvItemOrderPaymentStatus.setBackgroundResource(R.drawable.bg_badge_cancelled)
                itemBinding.tvItemOrderPaymentStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_red))
            }

            if (order.notes.isNotEmpty()) {
                itemBinding.tvItemOrderNotes.visibility = View.VISIBLE
                itemBinding.tvItemOrderNotes.text = "Catatan: ${order.notes}"
            } else {
                itemBinding.tvItemOrderNotes.visibility = View.GONE
            }

            itemBinding.root.setOnClickListener {
                displayOrderDetail(order)
                binding.scrollTrack.smoothScrollTo(0, binding.cardTrackingDetail.top)
            }

            binding.layoutOrdersList.addView(itemBinding.root)
        }
    }

    private fun formatRupiah(amount: Double): String {
        return "Rp " + NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount.toLong())
    }

    // Menampilkan Dialog Pembayaran Lengkap (QRIS, Bank BCA, Tunai)
    private fun showPaymentDialog(order: Order) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_payment, null)
        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        val tvOrderCode = dialogView.findViewById<TextView>(R.id.tvPaymentDialogOrderCode)
        val tvAmount = dialogView.findViewById<TextView>(R.id.tvPaymentDialogAmount)
        val btnClose = dialogView.findViewById<ImageButton>(R.id.btnPaymentDialogClose)

        val rgTabs = dialogView.findViewById<android.widget.RadioGroup>(R.id.rgPaymentTabs)
        val rbQris = dialogView.findViewById<android.widget.RadioButton>(R.id.rbTabQris)
        val rbBca = dialogView.findViewById<android.widget.RadioButton>(R.id.rbTabBca)
        val rbCash = dialogView.findViewById<android.widget.RadioButton>(R.id.rbTabCash)

        val layoutQris = dialogView.findViewById<View>(R.id.layoutContentQris)
        val layoutBca = dialogView.findViewById<View>(R.id.layoutContentBca)
        val layoutCash = dialogView.findViewById<View>(R.id.layoutContentCash)
        val ivQris = dialogView.findViewById<android.widget.ImageView>(R.id.ivQrisBitmap)

        val btnCopyBca = dialogView.findViewById<Button>(R.id.btnCopyBcaNumber)
        val btnSendWa = dialogView.findViewById<Button>(R.id.btnPaymentSendWa)
        val btnMarkPaid = dialogView.findViewById<Button>(R.id.btnPaymentMarkPaid)

        tvOrderCode.text = "Kode Pesanan: ${order.orderCode}"
        tvAmount.text = formatRupiah(order.totalPrice)

        // Generate QRIS Bitmap instan via ZXing
        val qrisPayload = "00020101021226670016ID.CO.ERLESBAKERY.WWW01189360099900000000015204581253360360540${order.totalPrice.toInt()}5802ID5912ERLES BAKERY6006KEDIRI6304${order.orderCode}"
        val qrBitmap = QRCodeUtil.generateQRCode(qrisPayload, 500)
        if (qrBitmap != null) {
            ivQris.setImageBitmap(qrBitmap)
        }

        // Tab selection logic
        rgTabs.setOnCheckedChangeListener { _, checkedId ->
            when (checkedId) {
                R.id.rbTabQris -> {
                    layoutQris.visibility = View.VISIBLE
                    layoutBca.visibility = View.GONE
                    layoutCash.visibility = View.GONE

                    rbQris.setBackgroundResource(R.drawable.bg_badge_category)
                    rbQris.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_dark))
                    rbBca.setBackgroundResource(R.drawable.bg_search_bar)
                    rbBca.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
                    rbCash.setBackgroundResource(R.drawable.bg_search_bar)
                    rbCash.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
                }
                R.id.rbTabBca -> {
                    layoutQris.visibility = View.GONE
                    layoutBca.visibility = View.VISIBLE
                    layoutCash.visibility = View.GONE

                    rbBca.setBackgroundResource(R.drawable.bg_badge_category)
                    rbBca.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_dark))
                    rbQris.setBackgroundResource(R.drawable.bg_search_bar)
                    rbQris.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
                    rbCash.setBackgroundResource(R.drawable.bg_search_bar)
                    rbCash.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
                }
                R.id.rbTabCash -> {
                    layoutQris.visibility = View.GONE
                    layoutBca.visibility = View.GONE
                    layoutCash.visibility = View.VISIBLE

                    rbCash.setBackgroundResource(R.drawable.bg_badge_category)
                    rbCash.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_dark))
                    rbQris.setBackgroundResource(R.drawable.bg_search_bar)
                    rbQris.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
                    rbBca.setBackgroundResource(R.drawable.bg_search_bar)
                    rbBca.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
                }
            }
        }

        // Salin nomor rekening BCA
        btnCopyBca.setOnClickListener {
            val clipboard = requireContext().getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText("No Rekening BCA", "8120938471")
            clipboard.setPrimaryClip(clip)
            Toast.makeText(requireContext(), "Nomor rekening BCA (8120938471) berhasil disalin!", Toast.LENGTH_SHORT).show()
        }

        // Kirim konfirmasi pembayaran via WhatsApp ke Kasir
        btnSendWa.setOnClickListener {
            val msg = "Halo Kasir Erles Bakery, saya ingin mengonfirmasi pembayaran untuk pesanan *${order.orderCode}* atas nama *${order.customerName}* sebesar *${formatRupiah(order.totalPrice)}*. Mohon diverifikasi ya."
            try {
                val encoded = URLEncoder.encode(msg, "UTF-8")
                val waIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?phone=6285717224420&text=$encoded"))
                startActivity(waIntent)
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Aplikasi WhatsApp tidak ditemukan", Toast.LENGTH_SHORT).show()
            }
        }

        // Tandai sudah bayar oleh pembeli & sinkronkan langsung ke Backend Web Admin ERP
        btnMarkPaid.setOnClickListener {
            val paymentMethod = when {
                rbBca.isChecked -> "transfer"
                rbCash.isChecked -> "tunai"
                else -> "qris"
            }

            btnMarkPaid.isEnabled = false
            btnMarkPaid.text = "Mengirim Pembayaran ke Web..."

            // 1. Simpan ke SQLite lokal agar UI instan menampilkan status LUNAS
            cartDbHelper.updateOrderPaymentStatus(order.orderCode, "paid")
            val refreshed = cartDbHelper.getOrderByCode(order.orderCode)
            if (refreshed != null) {
                currentDisplayedOrder = refreshed
                updatePaymentViews(refreshed)
                populateOrderHistoryList(cartDbHelper.getAllOrders())
            }

            // 2. Kirim ke REST API Backend Laravel ERP agar tercatat di Web Admin & Database MySQL
            farhan.zalfanudin.uts.network.ApiService.confirmPayment(
                context = requireContext(),
                orderCode = order.orderCode,
                amount = order.totalPrice,
                method = paymentMethod,
                onSuccess = { serverOrder ->
                    if (_binding != null && isAdded) {
                        cartDbHelper.updateOrderPaymentStatus(serverOrder.orderCode, serverOrder.paymentStatus)
                        val updated = cartDbHelper.getOrderByCode(serverOrder.orderCode) ?: serverOrder
                        currentDisplayedOrder = updated
                        updatePaymentViews(updated)
                        populateOrderHistoryList(cartDbHelper.getAllOrders())
                        Toast.makeText(
                            requireContext(),
                            "Pembayaran berhasil dicatat & disinkronkan ke Web Admin!",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    dialog.dismiss()
                },
                onError = { err ->
                    if (_binding != null && isAdded) {
                        Toast.makeText(
                            requireContext(),
                            "Pembayaran tersimpan di HP. Catatan server: $err",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                    dialog.dismiss()
                }
            )
        }

        btnClose.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    // Tampilkan Lokasi Outlet Toko di Peta OSM
    private fun showBakeryLocationMapDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_osm_map, null)
        val osmMapView = dialogView.findViewById<MapView>(R.id.osmMapView)
        val tvMapTitle = dialogView.findViewById<TextView>(R.id.tvMapTitle)
        val tvMapSubtitle = dialogView.findViewById<TextView>(R.id.tvMapSubtitle)
        val tvSelectedAddressDesc = dialogView.findViewById<TextView>(R.id.tvSelectedAddressDesc)
        val btnConfirmLocation = dialogView.findViewById<Button>(R.id.btnConfirmLocation)
        val btnMapClose = dialogView.findViewById<ImageButton>(R.id.btnMapClose)

        tvMapTitle.text = "Lokasi Outlet Erles Bakery"
        tvMapSubtitle.text = "Jl. Mayor Bismo No. 27, Kota Kediri"
        tvSelectedAddressDesc.text = "Outlet Erles Bakery (Jl. Mayor Bismo No. 27 Kediri) • Buka Setiap Hari 07:00 - 21:00 WIB"
        btnConfirmLocation.text = "Tutup Peta"

        osmMapView.setTileSource(TileSourceFactory.MAPNIK)
        osmMapView.setMultiTouchControls(true)

        val bakeryPoint = GeoPoint(-7.8014, 112.0069)
        osmMapView.controller.setZoom(17.0)
        osmMapView.controller.setCenter(bakeryPoint)

        val marker = Marker(osmMapView).apply {
            position = bakeryPoint
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
            title = "Outlet Erles Bakery"
            snippet = "Jl. Mayor Bismo No. 27 Kediri"
        }
        osmMapView.overlays.add(marker)
        marker.showInfoWindow()

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        btnMapClose.setOnClickListener {
            osmMapView.onDetach()
            dialog.dismiss()
        }

        btnConfirmLocation.setOnClickListener {
            osmMapView.onDetach()
            dialog.dismiss()
        }

        dialog.show()
    }

    // Tampilkan Simulasi Rute Pengantaran Kurir Toko di Peta OSM
    private fun showDeliveryRouteMapDialog(order: Order) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_osm_map, null)
        val osmMapView = dialogView.findViewById<MapView>(R.id.osmMapView)
        val tvMapTitle = dialogView.findViewById<TextView>(R.id.tvMapTitle)
        val tvMapSubtitle = dialogView.findViewById<TextView>(R.id.tvMapSubtitle)
        val tvSelectedAddressDesc = dialogView.findViewById<TextView>(R.id.tvSelectedAddressDesc)
        val btnConfirmLocation = dialogView.findViewById<Button>(R.id.btnConfirmLocation)
        val btnMapClose = dialogView.findViewById<ImageButton>(R.id.btnMapClose)

        tvMapTitle.text = "Rute Pengantaran Kurir"
        tvMapSubtitle.text = "Navigasi dari Outlet Toko ke Alamat Rumah Anda"
        tvSelectedAddressDesc.text = "Dari Outlet Erles Bakery menuju: ${order.address}"
        btnConfirmLocation.text = "Tutup Peta Rute"

        osmMapView.setTileSource(TileSourceFactory.MAPNIK)
        osmMapView.setMultiTouchControls(true)

        val bakeryPoint = GeoPoint(-7.8014, 112.0069)
        val customerPoint = getDestinationGeoPoint(order.address)

        // Marker 1: Outlet Toko
        val bakeryMarker = Marker(osmMapView).apply {
            position = bakeryPoint
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
            title = "Outlet Erles Bakery (Asal)"
            snippet = "Jl. Mayor Bismo No. 27 Kediri"
        }
        osmMapView.overlays.add(bakeryMarker)

        // Marker 2: Alamat Rumah Pelanggan
        val customerMarker = Marker(osmMapView).apply {
            position = customerPoint
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
            title = "Tujuan: ${order.customerName}"
            snippet = order.address
        }
        osmMapView.overlays.add(customerMarker)

        // Rute Garis Polyline menghubungkan Toko dan Rumah Pelanggan
        val routeLine = Polyline(osmMapView).apply {
            outlinePaint.color = ContextCompat.getColor(requireContext(), R.color.primary_dark)
            outlinePaint.strokeWidth = 12f
            addPoint(bakeryPoint)
            // Waypoint belokan perantara agar jalur menyerupai rute jalan raya
            val midPoint = GeoPoint((bakeryPoint.latitude + customerPoint.latitude) / 2, customerPoint.longitude)
            addPoint(midPoint)
            addPoint(customerPoint)
        }
        osmMapView.overlays.add(routeLine)

        val centerLat = (bakeryPoint.latitude + customerPoint.latitude) / 2
        val centerLng = (bakeryPoint.longitude + customerPoint.longitude) / 2
        osmMapView.controller.setZoom(14.5)
        osmMapView.controller.setCenter(GeoPoint(centerLat, centerLng))

        customerMarker.showInfoWindow()

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        btnMapClose.setOnClickListener {
            osmMapView.onDetach()
            dialog.dismiss()
        }

        btnConfirmLocation.setOnClickListener {
            osmMapView.onDetach()
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun getDestinationGeoPoint(addressStr: String): GeoPoint {
        return try {
            val geocoder = Geocoder(requireContext(), Locale.forLanguageTag("id-ID"))
            val list = geocoder.getFromLocationName(addressStr, 1)
            if (!list.isNullOrEmpty()) {
                GeoPoint(list[0].latitude, list[0].longitude)
            } else {
                GeoPoint(-7.8220, 112.0140)
            }
        } catch (_: Exception) {
            GeoPoint(-7.8220, 112.0140)
        }
    }

    override fun onStop() {
        super.onStop()
        // Lepas snapshot listener saat fragment berhenti agar hemat resource
        firestoreListener?.remove()
        firestoreListener = null
    }

    override fun onDestroyView() {
        super.onDestroyView()
        firestoreListener?.remove()
        firestoreListener = null
        _binding = null
    }

    companion object {
        const val ARG_ORDER_CODE = "arg_order_code"

        fun newInstance(orderCode: String): TrackingFragment {
            return TrackingFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_ORDER_CODE, orderCode)
                }
            }
        }
    }
}
