package farhan.zalfanudin.uts

import android.app.AlertDialog
import android.os.Bundle
import android.view.ContextMenu
import android.view.LayoutInflater
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.android.material.bottomnavigation.BottomNavigationView
import farhan.zalfanudin.uts.adapter.CartAdapter
import farhan.zalfanudin.uts.data.CartDatabaseHelper
import farhan.zalfanudin.uts.databinding.FragmentCartBinding
import farhan.zalfanudin.uts.model.CartItem
import java.text.NumberFormat
import java.util.Locale

class CartFragment : Fragment() {

    private var _binding: FragmentCartBinding? = null
    private val binding get() = _binding!!

    private lateinit var cartDbHelper: CartDatabaseHelper
    private lateinit var cartAdapter: CartAdapter
    private var cartItems = mutableListOf<CartItem>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCartBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        cartDbHelper = CartDatabaseHelper(requireContext())

        setupListView()
        setupListeners()

        // Daftarkan ListView untuk ContextMenu (Poin Penilaian Dosen: ContextMenu)
        registerForContextMenu(binding.lvCart)

        loadCartData()
    }

    override fun onResume() {
        super.onResume()
        // Muat ulang data setiap kali pengguna membuka tab keranjang
        loadCartData()
    }

    private fun setupListView() {
        cartAdapter = CartAdapter(
            context = requireContext(),
            cartList = cartItems,
            onIncreaseClick = { item ->
                cartDbHelper.updateQuantity(item.id, item.quantity + 1)
                loadCartData()
            },
            onDecreaseClick = { item ->
                if (item.quantity > 1) {
                    cartDbHelper.updateQuantity(item.id, item.quantity - 1)
                    loadCartData()
                } else {
                    confirmDeleteItem(item)
                }
            },
            onDeleteClick = { item ->
                confirmDeleteItem(item)
            }
        )

        binding.lvCart.adapter = cartAdapter
    }

    private fun setupListeners() {
        // Tombol Kosongkan Seluruh Keranjang
        binding.btnClearCart.setOnClickListener {
            if (cartItems.isEmpty()) return@setOnClickListener

            AlertDialog.Builder(requireContext())
                .setTitle("Kosongkan Keranjang?")
                .setMessage("Semua pesanan roti di keranjang Anda akan dihapus.")
                .setPositiveButton("Ya, Hapus Semua") { _, _ ->
                    cartDbHelper.clearCart()
                    loadCartData()
                    Toast.makeText(requireContext(), "Keranjang berhasil dikosongkan", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("Batal", null)
                .show()
        }

        // Tombol Kembali ke Katalog saat keranjang kosong
        binding.btnExploreMenu.setOnClickListener {
            // Berpindah otomatis ke Tab Menu pada BottomNavigationView
            val bottomNav = requireActivity().findViewById<BottomNavigationView>(R.id.bottom_nav)
            bottomNav?.selectedItemId = R.id.nav_menu
        }

        // Tombol Lanjut ke Checkout
        binding.btnCheckout.setOnClickListener {
            if (cartItems.isEmpty()) {
                Toast.makeText(requireContext(), "Keranjang Anda masih kosong", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val intent = android.content.Intent(requireContext(), CheckoutActivity::class.java)
            startActivity(intent)
        }
    }

    // Memuat seluruh item dari SQLite lokal
    private fun loadCartData() {
        cartItems = cartDbHelper.getAllCartItems().toMutableList()
        cartAdapter.updateData(cartItems)

        val totalCount = cartDbHelper.getTotalItemCount()
        val totalPrice = cartDbHelper.getTotalPrice()

        binding.tvCartItemCount.text = "$totalCount roti dipilih"
        binding.tvCartTotalPrice.text = formatRupiah(totalPrice)

        // Perbarui badge angka di ikon keranjang BottomNav
        (activity as? MainActivity)?.updateCartBadge()

        if (cartItems.isEmpty()) {
            binding.layoutCartEmpty.visibility = View.VISIBLE
            binding.lvCart.visibility = View.GONE
            binding.layoutCheckoutBar.visibility = View.GONE
            binding.btnClearCart.visibility = View.GONE
        } else {
            binding.layoutCartEmpty.visibility = View.GONE
            binding.lvCart.visibility = View.VISIBLE
            binding.layoutCheckoutBar.visibility = View.VISIBLE
            binding.btnClearCart.visibility = View.VISIBLE
        }
    }

    // Konfirmasi hapus satuan item
    private fun confirmDeleteItem(item: CartItem) {
        AlertDialog.Builder(requireContext())
            .setTitle("Hapus Item?")
            .setMessage("Apakah Anda ingin menghapus '${item.name}' dari keranjang?")
            .setPositiveButton("Hapus") { _, _ ->
                cartDbHelper.deleteItem(item.id)
                loadCartData()
                Toast.makeText(requireContext(), "${item.name} dihapus dari keranjang", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    // --- IMPLEMENTASI CONTEXT MENU (Poin Penilaian Dosen: ContextMenu) ---
    override fun onCreateContextMenu(menu: ContextMenu, v: View, menuInfo: ContextMenu.ContextMenuInfo?) {
        super.onCreateContextMenu(menu, v, menuInfo)
        val info = menuInfo as? AdapterView.AdapterContextMenuInfo ?: return
        val selectedItem = cartItems.getOrNull(info.position) ?: return

        menu.setHeaderTitle(selectedItem.name)
        menu.add(0, MENU_ADD_NOTE, 0, "Tambah / Ubah Catatan Roti")
        menu.add(0, MENU_DELETE_ITEM, 1, "Hapus dari Keranjang")
    }

    override fun onContextItemSelected(item: MenuItem): Boolean {
        val info = item.menuInfo as? AdapterView.AdapterContextMenuInfo ?: return super.onContextItemSelected(item)
        val selectedItem = cartItems.getOrNull(info.position) ?: return super.onContextItemSelected(item)

        return when (item.itemId) {
            MENU_ADD_NOTE -> {
                showAddNoteDialog(selectedItem)
                true
            }
            MENU_DELETE_ITEM -> {
                confirmDeleteItem(selectedItem)
                true
            }
            else -> super.onContextItemSelected(item)
        }
    }

    // Dialog input catatan khusus roti (misal: "potong jadi 2", "hangatkan")
    private fun showAddNoteDialog(item: CartItem) {
        val input = EditText(requireContext()).apply {
            hint = "Contoh: Potong jadi 2, jangan terlalu manis"
            setText(item.notes)
            setPadding(48, 32, 48, 32)
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Catatan untuk ${item.name}")
            .setView(input)
            .setPositiveButton("Simpan") { _, _ ->
                val newNote = input.text.toString().trim()
                // Update catatan di database SQLite
                val db = cartDbHelper.writableDatabase
                val values = android.content.ContentValues().apply {
                    put(CartDatabaseHelper.COLUMN_NOTES, newNote)
                }
                db.update(
                    CartDatabaseHelper.TABLE_CART,
                    values,
                    "${CartDatabaseHelper.COLUMN_ID} = ?",
                    arrayOf(item.id.toString())
                )
                loadCartData()
                Toast.makeText(requireContext(), "Catatan berhasil disimpan", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun formatRupiah(amount: Double): String {
        return "Rp " + NumberFormat.getNumberInstance(Locale.forLanguageTag("id-ID")).format(amount.toLong())
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val MENU_ADD_NOTE = 101
        private const val MENU_DELETE_ITEM = 102
    }
}
