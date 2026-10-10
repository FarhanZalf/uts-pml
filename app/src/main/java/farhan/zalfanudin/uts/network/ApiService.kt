package farhan.zalfanudin.uts.network

import android.content.Context
import android.util.Log
import com.android.volley.DefaultRetryPolicy
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import farhan.zalfanudin.uts.R
import farhan.zalfanudin.uts.model.CartItem
import farhan.zalfanudin.uts.model.Category
import farhan.zalfanudin.uts.model.Order
import farhan.zalfanudin.uts.model.Product
import org.json.JSONArray
import org.json.JSONObject

/**
 * Service untuk menangani komunikasi jaringan REST API Erles Bakery ERP menggunakan Android Volley.
 * Implementasi Poin Penilaian Dosen UTS:
 * - Poin #18: Database MySQL & Web Service/API (Bobot 2%)
 * - Poin #19: Pustaka Volley (Bobot 1%)
 */
object ApiService {

    private const val TAG = "ApiService"
    private const val TIMEOUT_MS = 10000

    /**
     * Mengambil daftar kategori dari backend Laravel: GET /api/categories
     */
    fun getCategories(
        context: Context,
        onSuccess: (List<Category>) -> Unit,
        onError: (String) -> Unit
    ) {
        val url = ApiConfig.getCategoriesUrl(context)

        val request = object : JsonObjectRequest(
            Method.GET,
            url,
            null,
            { response ->
                try {
                    val categories = mutableListOf<Category>()
                    // Opsi default untuk menampilkan semua produk
                    categories.add(Category(id = 0, name = "Semua Kategori"))

                    val dataArray = response.optJSONArray("data") ?: JSONArray()
                    for (i in 0 until dataArray.length()) {
                        val item = dataArray.getJSONObject(i)
                        val id = item.optInt("id", i + 1)
                        val name = item.optString("name", "")
                        if (name.isNotEmpty()) {
                            categories.add(Category(id = id, name = name))
                        }
                    }
                    onSuccess(categories)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing categories: ${e.message}", e)
                    onError("Gagal memproses data kategori dari server")
                }
            },
            { error ->
                val errorMsg = error.message ?: "Koneksi ke backend gagal"
                Log.e(TAG, "Volley getCategories error: $errorMsg")
                onError(errorMsg)
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                return mutableMapOf(
                    "Accept" to "application/json",
                    "Content-Type" to "application/json"
                )
            }
        }

        request.retryPolicy = DefaultRetryPolicy(
            TIMEOUT_MS,
            DefaultRetryPolicy.DEFAULT_MAX_RETRIES,
            DefaultRetryPolicy.DEFAULT_BACKOFF_MULT
        )

        VolleySingleton.getInstance(context).addToRequestQueue(request)
    }

    /**
     * Mengambil daftar produk dari backend Laravel: GET /api/products?per_page=50
     */
    fun getProducts(
        context: Context,
        search: String? = null,
        category: String? = null,
        onSuccess: (List<Product>) -> Unit,
        onError: (String) -> Unit
    ) {
        var url = "${ApiConfig.getProductsUrl(context)}?per_page=50"
        if (!search.isNullOrBlank()) {
            url += "&search=${java.net.URLEncoder.encode(search, "UTF-8")}"
        }
        if (!category.isNullOrBlank() && category != "Semua Kategori") {
            url += "&kategori=${java.net.URLEncoder.encode(category, "UTF-8")}"
        }

        val request = object : JsonObjectRequest(
            Method.GET,
            url,
            null,
            { response ->
                try {
                    val products = mutableListOf<Product>()
                    val dataArray = response.optJSONArray("data") ?: JSONArray()
                    for (i in 0 until dataArray.length()) {
                        val item = dataArray.getJSONObject(i)
                        val id = item.optInt("id", i + 1)
                        val name = item.optString("nama", item.optString("name", "Produk"))
                        val cat = item.optString("kategori", item.optString("category", "Roti"))
                        val price = item.optDouble("harga", item.optDouble("price", 0.0))
                        val stock = item.optInt("stok", item.optInt("stock", 0))
                        val desc = item.optString("deskripsi", item.optString("description", ""))

                        products.add(
                            Product(
                                id = id,
                                name = name,
                                category = cat,
                                price = price,
                                stock = stock,
                                description = desc,
                                imageRes = R.drawable.ic_bakery_item
                            )
                        )
                    }
                    onSuccess(products)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing products: ${e.message}", e)
                    onError("Gagal memproses data produk dari server")
                }
            },
            { error ->
                val errorMsg = error.message ?: "Koneksi ke backend gagal"
                Log.e(TAG, "Volley getProducts error: $errorMsg")
                onError(errorMsg)
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                return mutableMapOf(
                    "Accept" to "application/json",
                    "Content-Type" to "application/json"
                )
            }
        }

        request.retryPolicy = DefaultRetryPolicy(
            TIMEOUT_MS,
            DefaultRetryPolicy.DEFAULT_MAX_RETRIES,
            DefaultRetryPolicy.DEFAULT_BACKOFF_MULT
        )

        VolleySingleton.getInstance(context).addToRequestQueue(request)
    }

    /**
     * Mengirim pesanan baru ke backend Laravel ERP: POST /api/orders
     * Sesuai kontrak API Erles Bakery ERP.
     */
    fun submitOrder(
        context: Context,
        customerName: String,
        customerPhone: String,
        address: String,
        notes: String,
        pickupDate: String,
        cartItems: List<CartItem>,
        onSuccess: (Order) -> Unit,
        onError: (String) -> Unit
    ) {
        val url = ApiConfig.getOrdersUrl(context)

        val payload = JSONObject().apply {
            put("customer_name", customerName)
            put("customer_phone", customerPhone)
            put("alamat", address)
            put("catatan", notes)
            put("tanggal_ambil", pickupDate)

            val itemsArray = JSONArray()
            for (item in cartItems) {
                val itemObj = JSONObject().apply {
                    put("product_id", item.productId)
                    put("qty", item.quantity)
                }
                itemsArray.put(itemObj)
            }
            put("items", itemsArray)
        }

        val request = object : JsonObjectRequest(
            Method.POST,
            url,
            payload,
            { response ->
                try {
                    val dataObj = response.optJSONObject("data")
                    if (dataObj != null) {
                        val orderCode = dataObj.optString("kode_pesanan", "")
                        val totalPrice = dataObj.optDouble("total_price", 0.0)
                        val status = dataObj.optString("status", "pending")
                        val createdAt = dataObj.optString("created_at", "")
                        val orderId = dataObj.optInt("id", 0)

                        val createdOrder = Order(
                            id = orderId,
                            orderCode = orderCode,
                            customerName = customerName,
                            customerPhone = customerPhone,
                            address = address,
                            notes = notes,
                            pickupDate = pickupDate,
                            totalPrice = totalPrice,
                            status = status,
                            createdAt = createdAt
                        )
                        onSuccess(createdOrder)
                    } else {
                        val message = response.optString("message", "Pesanan berhasil dibuat")
                        onError(message)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing submitOrder response: ${e.message}", e)
                    onError("Gagal membaca respon pesanan dari server")
                }
            },
            { error ->
                var errorMsg = "Gagal mengirim pesanan ke server"
                try {
                    error.networkResponse?.data?.let { data ->
                        val respStr = String(data, Charsets.UTF_8)
                        val errorJson = JSONObject(respStr)
                        errorMsg = errorJson.optString("message", errorMsg)
                    }
                } catch (_: Exception) {}

                Log.e(TAG, "Volley submitOrder error: $errorMsg")
                onError(errorMsg)
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                return mutableMapOf(
                    "Accept" to "application/json",
                    "Content-Type" to "application/json"
                )
            }
        }

        request.retryPolicy = DefaultRetryPolicy(
            TIMEOUT_MS,
            0, // Tidak retry otomatis untuk operasi POST pesanan agar tidak double order
            DefaultRetryPolicy.DEFAULT_BACKOFF_MULT
        )

        VolleySingleton.getInstance(context).addToRequestQueue(request)
    }

    /**
     * Melacak status pesanan publik via HTTP: GET /api/orders/track/{orderCode}
     */
    fun trackOrder(
        context: Context,
        orderCode: String,
        onSuccess: (Order) -> Unit,
        onError: (String) -> Unit
    ) {
        val url = ApiConfig.getTrackOrderUrl(context, orderCode.trim())

        val request = object : JsonObjectRequest(
            Method.GET,
            url,
            null,
            { response ->
                try {
                    val dataObj = response.optJSONObject("data")
                    if (dataObj != null) {
                        val code = dataObj.optString("kode_pesanan", orderCode)
                        val customerName = dataObj.optString("customer_name", "")
                        val customerPhone = dataObj.optString("customer_phone", "")
                        val address = dataObj.optString("alamat", "")
                        val notes = dataObj.optString("catatan", "")
                        val pickupDate = dataObj.optString("tanggal_ambil", "")
                        val totalPrice = dataObj.optDouble("total_price", 0.0)
                        val status = dataObj.optString("status", "pending")
                        val createdAt = dataObj.optString("created_at", "")
                        val orderId = dataObj.optInt("id", 0)

                        val trackedOrder = Order(
                            id = orderId,
                            orderCode = code,
                            customerName = customerName,
                            customerPhone = customerPhone,
                            address = address,
                            notes = notes,
                            pickupDate = pickupDate,
                            totalPrice = totalPrice,
                            status = status,
                            createdAt = createdAt
                        )
                        onSuccess(trackedOrder)
                    } else {
                        onError("Data pesanan tidak ditemukan")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing trackOrder response: ${e.message}", e)
                    onError("Gagal memproses data pelacakan dari server")
                }
            },
            { error ->
                val errorMsg = error.message ?: "Pesanan tidak ditemukan di server"
                Log.e(TAG, "Volley trackOrder error: $errorMsg")
                onError(errorMsg)
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                return mutableMapOf(
                    "Accept" to "application/json",
                    "Content-Type" to "application/json"
                )
            }
        }

        request.retryPolicy = DefaultRetryPolicy(
            TIMEOUT_MS,
            DefaultRetryPolicy.DEFAULT_MAX_RETRIES,
            DefaultRetryPolicy.DEFAULT_BACKOFF_MULT
        )

        VolleySingleton.getInstance(context).addToRequestQueue(request)
    }
}
