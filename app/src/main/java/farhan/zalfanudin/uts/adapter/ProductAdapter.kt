package farhan.zalfanudin.uts.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import farhan.zalfanudin.uts.databinding.ItemProductBinding
import farhan.zalfanudin.uts.model.Product
import java.text.NumberFormat
import java.util.Locale

class ProductAdapter(
    private val context: Context,
    private var productList: List<Product>,
    private val onProductClick: (Product) -> Unit,
    private val onAddToCartClick: (Product) -> Unit
) : BaseAdapter() {

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("id-ID"))

    fun updateData(newList: List<Product>) {
        productList = newList
        notifyDataSetChanged()
    }

    override fun getCount(): Int = productList.size

    override fun getItem(position: Int): Product = productList[position]

    override fun getItemId(position: Int): Long = productList[position].id.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val binding: ItemProductBinding
        val view: View

        if (convertView == null) {
            binding = ItemProductBinding.inflate(LayoutInflater.from(context), parent, false)
            view = binding.root
            view.tag = binding
        } else {
            view = convertView
            binding = view.tag as ItemProductBinding
        }

        val product = getItem(position)

        binding.tvProductName.text = product.name
        binding.tvProductCategory.text = product.category
        binding.tvProductStock.text = "Stok: ${product.stock}"
        binding.tvProductPrice.text = formatRupiah(product.price)
        binding.ivProduct.setImageResource(product.imageRes)

        view.setOnClickListener {
            onProductClick(product)
        }

        binding.btnAddToCart.setOnClickListener {
            onAddToCartClick(product)
        }

        return view
    }

    private fun formatRupiah(amount: Double): String {
        return "Rp " + NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount.toLong())
    }
}
