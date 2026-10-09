package farhan.zalfanudin.uts.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import farhan.zalfanudin.uts.databinding.ItemCartBinding
import farhan.zalfanudin.uts.model.CartItem
import java.text.NumberFormat
import java.util.Locale

class CartAdapter(
    private val context: Context,
    private var cartList: List<CartItem>,
    private val onIncreaseClick: (CartItem) -> Unit,
    private val onDecreaseClick: (CartItem) -> Unit,
    private val onDeleteClick: (CartItem) -> Unit
) : BaseAdapter() {

    fun updateData(newList: List<CartItem>) {
        cartList = newList
        notifyDataSetChanged()
    }

    override fun getCount(): Int = cartList.size

    override fun getItem(position: Int): CartItem = cartList[position]

    override fun getItemId(position: Int): Long = cartList[position].id.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val binding: ItemCartBinding
        val view: View

        if (convertView == null) {
            binding = ItemCartBinding.inflate(LayoutInflater.from(context), parent, false)
            view = binding.root
            view.tag = binding
        } else {
            view = convertView
            binding = view.tag as ItemCartBinding
        }

        val item = getItem(position)

        binding.tvCartName.text = item.name
        binding.tvCartPricePerPcs.text = "${formatRupiah(item.price)} / pcs"
        binding.tvCartQuantity.text = item.quantity.toString()
        binding.tvCartSubtotal.text = formatRupiah(item.price * item.quantity)
        binding.ivCartProduct.setImageResource(item.imageRes)

        if (item.notes.isNotEmpty()) {
            binding.tvCartNotes.visibility = View.VISIBLE
            binding.tvCartNotes.text = "Catatan: ${item.notes}"
        } else {
            binding.tvCartNotes.visibility = View.GONE
        }

        binding.btnCartPlus.setOnClickListener {
            onIncreaseClick(item)
        }

        binding.btnCartMinus.setOnClickListener {
            onDecreaseClick(item)
        }

        binding.btnCartDelete.setOnClickListener {
            onDeleteClick(item)
        }

        return view
    }

    private fun formatRupiah(amount: Double): String {
        return "Rp " + NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount.toLong())
    }
}
