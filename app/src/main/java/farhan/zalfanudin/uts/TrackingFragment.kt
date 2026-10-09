package farhan.zalfanudin.uts

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import farhan.zalfanudin.uts.data.CartDatabaseHelper
import farhan.zalfanudin.uts.databinding.FragmentTrackBinding
import farhan.zalfanudin.uts.databinding.ItemOrderBinding
import farhan.zalfanudin.uts.model.Order
import farhan.zalfanudin.uts.util.QRCodeUtil
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

        cartDbHelper = CartDatabaseHelper(requireContext())

        setupListeners()
        loadData()
    }

    override fun onResume() {
        super.onResume()
        loadData()
    }

    private fun setupListeners() {
        // Tombol Lacak berdasarkan input teks kode
        binding.btnSearchOrder.setOnClickListener {
            val codeInput = binding.etSearchOrderCode.text.toString().trim()
            if (codeInput.isEmpty()) {
                binding.etSearchOrderCode.error = "Ketik kode pesanan"
                return@setOnClickListener
            }

            val foundOrder = cartDbHelper.getOrderByCode(codeInput)
            if (foundOrder != null) {
                displayOrderDetail(foundOrder)
                // Scroll halus ke kartu detail
                binding.scrollTrack.smoothScrollTo(0, binding.cardTrackingDetail.top)
            } else {
                Toast.makeText(requireContext(), "Pesanan '$codeInput' tidak ditemukan di riwayat lokal", Toast.LENGTH_SHORT).show()
            }
        }

        // Tombol Cepat: Gunakan Pesanan Terakhir
        binding.btnQuickLatestOrder.setOnClickListener {
            val latest = cartDbHelper.getLatestOrder()
            if (latest != null) {
                binding.etSearchOrderCode.setText(latest.orderCode)
                displayOrderDetail(latest)
                binding.scrollTrack.smoothScrollTo(0, binding.cardTrackingDetail.top)
            } else {
                Toast.makeText(requireContext(), "Belum ada pesanan yang tercatat", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun loadData() {
        val orders = cartDbHelper.getAllOrders()
        populateOrderHistoryList(orders)

        // Jika kartu tracking belum pernah menampilkan pesanan, muat pesanan terakhir
        if (currentDisplayedOrder == null && orders.isNotEmpty()) {
            displayOrderDetail(orders.first())
        } else if (currentDisplayedOrder != null) {
            // Segarkan status pesanan yang sedang ditampilkan dari database
            val refreshed = cartDbHelper.getOrderByCode(currentDisplayedOrder!!.orderCode)
            if (refreshed != null) {
                displayOrderDetail(refreshed)
            }
        }
    }

    // Menampilkan detail order, tahapan status timeline, dan QR-Code tiket
    private fun displayOrderDetail(order: Order) {
        currentDisplayedOrder = order
        binding.cardTrackingDetail.visibility = View.VISIBLE

        binding.tvTrackDetailCode.text = order.orderCode
        binding.tvTrackDetailCustomer.text = "Pemesan: ${order.customerName} (${order.customerPhone})"
        binding.tvTrackDetailAddress.text = "Alamat/Lokasi: ${order.address}"
        binding.tvTrackDetailDate.text = "Jadwal Pengambilan: ${order.pickupDate}"
        binding.tvTrackDetailTotal.text = "Total Pembayaran: ${formatRupiah(order.totalPrice)}"

        if (order.notes.isNotEmpty()) {
            binding.tvTrackDetailNotes.visibility = View.VISIBLE
            binding.tvTrackDetailNotes.text = "Catatan Khusus: \"${order.notes}\""
        } else {
            binding.tvTrackDetailNotes.visibility = View.GONE
        }

        // Tampilan Badge & Timeline Stepper
        updateStatusViews(order.status)

        // Generate QR Code Tiket Pengambilan (Poin Penilaian Dosen #25 - QR Code 2%)
        val qrBitmap = QRCodeUtil.generateQRCode(order.orderCode, 450)
        if (qrBitmap != null) {
            binding.ivOrderQrCode.setImageBitmap(qrBitmap)
        }

        // Tombol WhatsApp Kasir (Implicit Intent)
        binding.btnContactKasirWa.setOnClickListener {
            openWhatsAppKasir(order)
        }

        // Tombol Demo: Simulasi Perubahan Status untuk Presentasi Dosen
        binding.btnSimulateNextStatus.setOnClickListener {
            simulateNextStatus(order)
        }
    }

    private fun updateStatusViews(status: String) {
        val statusClean = status.lowercase(Locale.getDefault())

        val colorAmber = ContextCompat.getColor(requireContext(), R.color.status_amber)
        val colorBlue = ContextCompat.getColor(requireContext(), R.color.status_blue)
        val colorGreen = ContextCompat.getColor(requireContext(), R.color.status_green)
        val colorMuted = ContextCompat.getColor(requireContext(), R.color.text_muted)
        val colorPrimary = ContextCompat.getColor(requireContext(), R.color.text_primary)

        when (statusClean) {
            "diproses" -> {
                binding.tvTrackDetailStatusBadge.text = "Sedang Diproses Toko"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_process)
                binding.tvTrackDetailStatusBadge.setTextColor(colorBlue)

                // Step 1: Lewat
                binding.tvStep1Text.setTextColor(colorMuted)
                // Step 2: Aktif
                binding.tvStep2Text.setTextColor(colorPrimary)
                binding.tvStep2Text.text = "2. Roti Sedang Dipanggang di Dapur (AKTIF)"
                binding.ivStep2Icon.setImageResource(R.drawable.ic_check_circle)
                // Step 3: Belum
                binding.tvStep3Text.setTextColor(colorMuted)
                binding.tvStep3Text.text = "3. Roti Siap Diambil / Diantar ke Alamat"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_bakery_item)
            }
            "siap" -> {
                binding.tvTrackDetailStatusBadge.text = "Siap Diambil di Outlet"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_success)
                binding.tvTrackDetailStatusBadge.setTextColor(colorGreen)

                binding.tvStep1Text.setTextColor(colorMuted)
                binding.tvStep2Text.setTextColor(colorMuted)
                binding.tvStep2Text.text = "2. Roti Telah Selesai Dipanggang"
                binding.tvStep3Text.setTextColor(colorPrimary)
                binding.tvStep3Text.text = "3. Roti Siap Diambil di Outlet (AKTIF)"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_check_circle)
            }
            "selesai" -> {
                binding.tvTrackDetailStatusBadge.text = "Pesanan Selesai"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_success)
                binding.tvTrackDetailStatusBadge.setTextColor(colorGreen)

                binding.tvStep1Text.setTextColor(colorMuted)
                binding.tvStep2Text.setTextColor(colorMuted)
                binding.tvStep2Text.text = "2. Roti Telah Selesai Dipanggang"
                binding.tvStep3Text.setTextColor(colorGreen)
                binding.tvStep3Text.text = "3. Roti Telah Diambil / Selesai Diterima"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_check_circle)
            }
            else -> { // "pending"
                binding.tvTrackDetailStatusBadge.text = "Menunggu Konfirmasi"
                binding.tvTrackDetailStatusBadge.setBackgroundResource(R.drawable.bg_badge_pending)
                binding.tvTrackDetailStatusBadge.setTextColor(colorAmber)

                binding.tvStep1Text.setTextColor(colorPrimary)
                binding.tvStep1Text.text = "1. Pesanan Diterima (Menunggu Konfirmasi)"
                binding.ivStep1Icon.setImageResource(R.drawable.ic_check_circle)

                binding.tvStep2Text.setTextColor(colorMuted)
                binding.tvStep2Text.text = "2. Roti Sedang Dipanggang di Dapur"
                binding.ivStep2Icon.setImageResource(R.drawable.ic_clock)

                binding.tvStep3Text.setTextColor(colorMuted)
                binding.tvStep3Text.text = "3. Roti Siap Diambil / Diantar ke Alamat"
                binding.ivStep3Icon.setImageResource(R.drawable.ic_bakery_item)
            }
        }
    }

    private fun simulateNextStatus(order: Order) {
        val nextStatus = when (order.status.lowercase(Locale.getDefault())) {
            "pending" -> "diproses"
            "diproses" -> "siap"
            "siap" -> "selesai"
            else -> "pending"
        }

        cartDbHelper.updateOrderStatus(order.orderCode, nextStatus)
        Toast.makeText(requireContext(), "Status diperbarui ke: $nextStatus (Demo)", Toast.LENGTH_SHORT).show()

        val updatedOrder = cartDbHelper.getOrderByCode(order.orderCode)
        if (updatedOrder != null) {
            displayOrderDetail(updatedOrder)
            populateOrderHistoryList(cartDbHelper.getAllOrders())
        }
    }

    private fun openWhatsAppKasir(order: Order) {
        val message = "Halo Kasir Erles Bakery, saya ingin konfirmasi pesanan saya dengan kode ${order.orderCode} atas nama ${order.customerName}."
        try {
            val encodedMsg = URLEncoder.encode(message, "UTF-8")
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=6281234567890&text=$encodedMsg")
            val intent = Intent(Intent.ACTION_VIEW, uri)
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "Aplikasi WhatsApp tidak terpasang di perangkat", Toast.LENGTH_SHORT).show()
        }
    }

    // Mengisi daftar riwayat seluruh pesanan ke dalam container LinearLayout
    private fun populateOrderHistoryList(orders: List<Order>) {
        binding.layoutOrdersList.removeAllViews()

        if (orders.isEmpty()) {
            binding.layoutHistoryEmpty.visibility = View.VISIBLE
            binding.tvHistoryHeaderCount.text = "Belum ada pesanan yang tersimpan."
            return
        }

        binding.layoutHistoryEmpty.visibility = View.GONE
        binding.tvHistoryHeaderCount.text = "${orders.size} pesanan tercatat di perangkat ini"

        val inflater = LayoutInflater.from(requireContext())
        for (order in orders) {
            val itemBinding = ItemOrderBinding.inflate(inflater, binding.layoutOrdersList, false)

            itemBinding.tvItemOrderCode.text = order.orderCode
            itemBinding.tvItemOrderCustomer.text = "Pemesan: ${order.customerName}"
            itemBinding.tvItemOrderDate.text = "Jadwal: ${order.pickupDate}"
            itemBinding.tvItemOrderTotal.text = formatRupiah(order.totalPrice)

            when (order.status.lowercase(Locale.getDefault())) {
                "diproses" -> {
                    itemBinding.tvItemOrderStatus.text = "Diproses"
                    itemBinding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_process)
                    itemBinding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_blue))
                }
                "siap", "selesai" -> {
                    itemBinding.tvItemOrderStatus.text = if (order.status.equals("selesai", ignoreCase = true)) "Selesai" else "Siap Diambil"
                    itemBinding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_success)
                    itemBinding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_green))
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
