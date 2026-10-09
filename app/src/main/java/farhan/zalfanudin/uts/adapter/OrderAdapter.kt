package farhan.zalfanudin.uts.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import androidx.core.content.ContextCompat
import farhan.zalfanudin.uts.R
import farhan.zalfanudin.uts.databinding.ItemOrderBinding
import farhan.zalfanudin.uts.model.Order
import java.text.NumberFormat
import java.util.Locale

class OrderAdapter(
    private val context: Context,
    private var orderList: List<Order>,
    private val onItemClick: (Order) -> Unit
) : BaseAdapter() {

    fun updateData(newList: List<Order>) {
        orderList = newList
        notifyDataSetChanged()
    }

    override fun getCount(): Int = orderList.size

    override fun getItem(position: Int): Order = orderList[position]

    override fun getItemId(position: Int): Long = orderList[position].id.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val binding: ItemOrderBinding
        val view: View

        if (convertView == null) {
            binding = ItemOrderBinding.inflate(LayoutInflater.from(context), parent, false)
            view = binding.root
            view.tag = binding
        } else {
            view = convertView
            binding = view.tag as ItemOrderBinding
        }

        val order = getItem(position)

        binding.tvItemOrderCode.text = order.orderCode
        binding.tvItemOrderCustomer.text = "Pemesan: ${order.customerName}"
        binding.tvItemOrderDate.text = "Jadwal: ${order.pickupDate}"
        binding.tvItemOrderTotal.text = formatRupiah(order.totalPrice)

        // Status badge styling
        when (order.status.lowercase(Locale.getDefault())) {
            "diproses" -> {
                binding.tvItemOrderStatus.text = "Diproses"
                binding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_process)
                binding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(context, R.color.status_blue))
            }
            "siap", "selesai" -> {
                binding.tvItemOrderStatus.text = if (order.status.equals("selesai", ignoreCase = true)) "Selesai" else "Siap Diambil"
                binding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_success)
                binding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(context, R.color.status_green))
            }
            else -> { // "pending"
                binding.tvItemOrderStatus.text = "Pending"
                binding.tvItemOrderStatus.setBackgroundResource(R.drawable.bg_badge_pending)
                binding.tvItemOrderStatus.setTextColor(ContextCompat.getColor(context, R.color.status_amber))
            }
        }

        if (order.notes.isNotEmpty()) {
            binding.tvItemOrderNotes.visibility = View.VISIBLE
            binding.tvItemOrderNotes.text = "Catatan: ${order.notes}"
        } else {
            binding.tvItemOrderNotes.visibility = View.GONE
        }

        binding.root.setOnClickListener {
            onItemClick(order)
        }

        return view
    }

    private fun formatRupiah(amount: Double): String {
        return "Rp " + NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount.toLong())
    }
}
