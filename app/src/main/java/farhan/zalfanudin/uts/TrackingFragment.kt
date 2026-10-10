package farhan.zalfanudin.uts

import android.content.Intent
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
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
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
import java.net.URLEncoder
import java.text.NumberFormat
import java.util.Locale

class TrackingFragment : Fragment() {

    private var _binding: FragmentTrackBinding? = null
    private val binding get() = _binding!!

    private lateinit var cartDbHelper: CartDatabaseHelper
    private var currentDisplayedOrder: Order? = null

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

        if (orders.isEmpty()) {
            binding.cardTrackingDetail.visibility = View.GONE
            binding.panelDemoTesting.visibility = View.GONE
            binding.layoutHistoryEmpty.visibility = View.VISIBLE
        } else {
            binding.layoutHistoryEmpty.visibility = View.GONE
            binding.panelDemoTesting.visibility = View.VISIBLE

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
        binding.panelDemoTesting.visibility = View.VISIBLE

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
            binding.tvTrackDeliveryMethod.text = "🏪 Ambil di Toko"
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
            binding.tvTrackDeliveryMethod.text = "🛵 Diantar Kurir"
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

        // Tombol Khusus Pengujian Dosen: Simulasi Update Status Kasir
        binding.btnSimulateNextStatus.setOnClickListener {
            simulateNextStatus(order)
        }

        // Sinkronisasi status pesanan terbaru dari Web Admin ERP via Volley (Poin UTS #18 & #19)
        syncOrderWithServer(order.orderCode)
    }

    private fun syncOrderWithServer(orderCode: String) {
        farhan.zalfanudin.uts.network.ApiService.trackOrder(
            context = requireContext(),
            orderCode = orderCode,
            onSuccess = { serverOrder ->
                if (_binding != null && isAdded) {
                    val currentStatus = currentDisplayedOrder?.status?.lowercase(Locale.getDefault())
                    val newStatus = serverOrder.status.lowercase(Locale.getDefault())
                    if (currentStatus != newStatus) {
                        cartDbHelper.updateOrderStatus(serverOrder.orderCode, serverOrder.status)
                        val refreshed = cartDbHelper.getOrderByCode(serverOrder.orderCode) ?: serverOrder
                        currentDisplayedOrder = refreshed
                        updateStatusViews(refreshed)
                        populateOrderHistoryList(cartDbHelper.getAllOrders())
                        Toast.makeText(
                            requireContext(),
                            "Status diperbarui oleh Web Admin: ${serverOrder.status.uppercase(Locale.getDefault())}",
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

    private fun simulateNextStatus(order: Order) {
        val nextStatus = when (order.status.lowercase(Locale.getDefault())) {
            "pending" -> "diproses"
            "diproses" -> "siap"
            "siap" -> "selesai"
            "dibatalkan" -> "pending"
            else -> "pending"
        }

        cartDbHelper.updateOrderStatus(order.orderCode, nextStatus)
        Toast.makeText(requireContext(), "Status diubah ke: $nextStatus (Simulasi Dosen)", Toast.LENGTH_SHORT).show()

        val updatedOrder = cartDbHelper.getOrderByCode(order.orderCode)
        if (updatedOrder != null) {
            displayOrderDetail(updatedOrder)
            populateOrderHistoryList(cartDbHelper.getAllOrders())
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
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=6281234567890&text=$encodedMsg")
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
