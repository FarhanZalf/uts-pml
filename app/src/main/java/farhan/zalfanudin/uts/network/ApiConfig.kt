package farhan.zalfanudin.uts.network

import android.content.Context

/**
 * Konfigurasi Endpoint REST API Erles Bakery ERP.
 * Default untuk Android Emulator: http://10.0.2.2:8000/api
 * Mendukung SharedPreferences jika ingin diarahkan ke IP LAN PC (misal: http://192.168.1.10:8000/api).
 */
object ApiConfig {

    private const val PREFS_NAME = "erles_api_prefs"
    private const val KEY_BASE_URL = "pref_base_url"

    // Host backend PC untuk pengujian HP fisik via Wi-Fi (melalui Vite Proxy port 5174 yang terbuka ke jaringan LAN):
    // Jika via USB adb reverse, gunakan: http://127.0.0.1:8000/api
    // Jika via Android Emulator, gunakan: http://10.0.2.2:8000/api
    const val DEFAULT_BASE_URL = "http://192.168.1.17:5174/api"

    fun getBaseUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    fun setBaseUrl(context: Context, newUrl: String) {
        val cleanUrl = newUrl.trim().removeSuffix("/")
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_BASE_URL, cleanUrl).apply()
    }

    fun getCategoriesUrl(context: Context): String = "${getBaseUrl(context)}/categories"

    fun getProductsUrl(context: Context): String = "${getBaseUrl(context)}/products"

    fun getOrdersUrl(context: Context): String = "${getBaseUrl(context)}/orders"

    fun getTrackOrderUrl(context: Context, orderCode: String): String =
        "${getBaseUrl(context)}/orders/track/$orderCode"
}
