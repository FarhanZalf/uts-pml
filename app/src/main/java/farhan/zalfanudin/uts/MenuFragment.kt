package farhan.zalfanudin.uts

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.widget.PopupMenu
import androidx.fragment.app.Fragment
import com.google.android.material.bottomsheet.BottomSheetDialog
import farhan.zalfanudin.uts.adapter.ProductAdapter
import farhan.zalfanudin.uts.data.CartDatabaseHelper
import farhan.zalfanudin.uts.data.DummyData
import farhan.zalfanudin.uts.databinding.DialogProductDetailBinding
import farhan.zalfanudin.uts.databinding.FragmentMenuBinding
import farhan.zalfanudin.uts.model.Product
import java.text.NumberFormat
import java.util.Locale

class MenuFragment : Fragment() {

    private var _binding: FragmentMenuBinding? = null
    private val binding get() = _binding!!

    private lateinit var cartDbHelper: CartDatabaseHelper
    private lateinit var productAdapter: ProductAdapter
    private var allProducts = mutableListOf<Product>()
    private var allCategories = mutableListOf<String>()
    private var displayedProducts = mutableListOf<Product>()
    private var selectedCategory: String = "Semua Kategori"
    private var searchQuery: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMenuBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        cartDbHelper = CartDatabaseHelper(requireContext())
        allProducts = DummyData.products.toMutableList()
        allCategories = DummyData.categories.map { it.name }.toMutableList()

        setupListView()
        setupAutoCompleteSearch()
        setupCategorySpinner()
        setupSortPopupMenu()

        // Poin UTS #18 & #19: Mengambil data real-time dari Web Service Laravel via Volley
        loadCategoriesFromApi()
        loadProductsFromApi()
    }

    private fun loadCategoriesFromApi() {
        farhan.zalfanudin.uts.network.ApiService.getCategories(
            requireContext(),
            onSuccess = { categories ->
                if (_binding != null && isAdded) {
                    allCategories = categories.map { it.name }.toMutableList()
                    val spinnerAdapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_item,
                        allCategories
                    )
                    spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    binding.spinnerCategory.adapter = spinnerAdapter
                }
            },
            onError = { _ ->
                // Tetap menggunakan DummyData kategori jika server offline
            }
        )
    }

    private fun loadProductsFromApi() {
        farhan.zalfanudin.uts.network.ApiService.getProducts(
            requireContext(),
            onSuccess = { products ->
                if (_binding != null && isAdded && products.isNotEmpty()) {
                    allProducts = products.toMutableList()
                    setupAutoCompleteSearch()
                    filterAndDisplayProducts()
                }
            },
            onError = { _ ->
                // Tetap menggunakan DummyData jika server offline
            }
        )
    }

    // 1. Setup ListView Produk
    private fun setupListView() {
        displayedProducts = allProducts.toMutableList()

        productAdapter = ProductAdapter(
            context = requireContext(),
            productList = displayedProducts,
            // Saat kartu roti diklik: Munculkan Pop-up BottomSheet Detail
            onProductClick = { product ->
                showProductDetailBottomSheet(product)
            },
            // Saat tombol + Beli diklik: Langsung masuk ke keranjang tanpa ganti halaman
            onAddToCartClick = { product ->
                cartDbHelper.addToCart(product, 1)
                (activity as? MainActivity)?.updateCartBadge()
                Toast.makeText(
                    requireContext(),
                    "${product.name} (1 pcs) dimasukkan ke keranjang!",
                    Toast.LENGTH_SHORT
                ).show()
            }
        )

        binding.lvProducts.adapter = productAdapter
    }

    // Menampilkan Pop-up Detail Roti (BottomSheet Dialog)
    private fun showProductDetailBottomSheet(product: Product) {
        val bottomSheet = BottomSheetDialog(requireContext())
        val dialogBinding = DialogProductDetailBinding.inflate(layoutInflater)
        bottomSheet.setContentView(dialogBinding.root)

        var selectedQty = 1

        // Isi data produk
        dialogBinding.tvDialogName.text = product.name
        dialogBinding.tvDialogCategory.text = product.category
        dialogBinding.tvDialogStock.text = "Tersedia: ${product.stock} pcs"
        dialogBinding.tvDialogPrice.text = "${formatRupiah(product.price)} / pcs"
        dialogBinding.tvDialogDescription.text = product.description
        dialogBinding.ivDialogProduct.setImageResource(product.imageRes)
        dialogBinding.tvDialogQuantity.text = selectedQty.toString()
        dialogBinding.tvDialogSubtotal.text = formatRupiah(product.price * selectedQty)

        // Tombol Minus
        dialogBinding.btnDialogMinus.setOnClickListener {
            if (selectedQty > 1) {
                selectedQty--
                dialogBinding.tvDialogQuantity.text = selectedQty.toString()
                dialogBinding.tvDialogSubtotal.text = formatRupiah(product.price * selectedQty)
            }
        }

        // Tombol Plus
        dialogBinding.btnDialogPlus.setOnClickListener {
            if (selectedQty < product.stock) {
                selectedQty++
                dialogBinding.tvDialogQuantity.text = selectedQty.toString()
                dialogBinding.tvDialogSubtotal.text = formatRupiah(product.price * selectedQty)
            } else {
                Toast.makeText(requireContext(), "Stok maksimal tercapai (${product.stock})", Toast.LENGTH_SHORT).show()
            }
        }

        // Tombol Masukkan Keranjang di dalam Pop-up
        dialogBinding.btnDialogAddToCart.setOnClickListener {
            cartDbHelper.addToCart(product, selectedQty)
            (activity as? MainActivity)?.updateCartBadge()
            Toast.makeText(
                requireContext(),
                "${selectedQty}x ${product.name} berhasil dimasukkan ke keranjang!",
                Toast.LENGTH_SHORT
            ).show()
            bottomSheet.dismiss()
        }

        bottomSheet.show()
    }

    // 2. Setup AutoCompleteTextView (Pencarian Otomatis)
    private fun setupAutoCompleteSearch() {
        val productNames = allProducts.map { it.name }
        val searchAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_dropdown_item_1line,
            productNames
        )
        binding.actvSearch.setAdapter(searchAdapter)

        binding.actvSearch.setOnItemClickListener { _, _, position, _ ->
            searchQuery = searchAdapter.getItem(position).orEmpty()
            filterAndDisplayProducts()
        }

        binding.actvSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                searchQuery = s.toString().trim()
                filterAndDisplayProducts()
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    // 3. Setup Spinner (Filter Kategori Roti)
    private fun setupCategorySpinner() {
        val categoryNames = allCategories
        val spinnerAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            categoryNames
        )
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerCategory.adapter = spinnerAdapter

        binding.spinnerCategory.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                selectedCategory = categoryNames.getOrNull(position) ?: "Semua Kategori"
                filterAndDisplayProducts()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    // 4. Setup PopupMenu (Sortir Harga & Nama)
    private fun setupSortPopupMenu() {
        binding.btnSort.setOnClickListener { v ->
            val popup = PopupMenu(requireContext(), v)
            popup.menu.add(0, 1, 0, "Harga: Termurah")
            popup.menu.add(0, 2, 1, "Harga: Termahal")
            popup.menu.add(0, 3, 2, "Nama: A - Z")
            popup.menu.add(0, 4, 3, "Stok: Terbanyak")

            popup.setOnMenuItemClickListener { item ->
                when (item.itemId) {
                    1 -> {
                        displayedProducts.sortBy { it.price }
                        binding.btnSort.text = "Termurah"
                    }
                    2 -> {
                        displayedProducts.sortByDescending { it.price }
                        binding.btnSort.text = "Termahal"
                    }
                    3 -> {
                        displayedProducts.sortBy { it.name }
                        binding.btnSort.text = "Nama A-Z"
                    }
                    4 -> {
                        displayedProducts.sortByDescending { it.stock }
                        binding.btnSort.text = "Stok"
                    }
                }
                productAdapter.updateData(displayedProducts)
                true
            }
            popup.show()
        }
    }

    private fun filterAndDisplayProducts() {
        var filtered = allProducts.toList()

        if (selectedCategory != "Semua Kategori") {
            filtered = filtered.filter { it.category.equals(selectedCategory, ignoreCase = true) }
        }

        if (searchQuery.isNotEmpty()) {
            filtered = filtered.filter { it.name.contains(searchQuery, ignoreCase = true) }
        }

        displayedProducts = filtered.toMutableList()
        productAdapter.updateData(displayedProducts)

        if (displayedProducts.isEmpty()) {
            binding.tvEmpty.visibility = View.VISIBLE
            binding.lvProducts.visibility = View.GONE
        } else {
            binding.tvEmpty.visibility = View.GONE
            binding.lvProducts.visibility = View.VISIBLE
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
