package farhan.zalfanudin.uts.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import farhan.zalfanudin.uts.model.CartItem
import farhan.zalfanudin.uts.model.Order
import farhan.zalfanudin.uts.model.Product

class CartDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "erles_bakery.db"
        private const val DATABASE_VERSION = 3

        // Tabel Keranjang
        const val TABLE_CART = "cart_items"
        const val COLUMN_ID = "id"
        const val COLUMN_PRODUCT_ID = "product_id"
        const val COLUMN_NAME = "name"
        const val COLUMN_CATEGORY = "category"
        const val COLUMN_PRICE = "price"
        const val COLUMN_QUANTITY = "quantity"
        const val COLUMN_IMAGE_RES = "image_res"
        const val COLUMN_NOTES = "notes"

        // Tabel Riwayat Pesanan (Selaras dengan tabel orders di MySQL)
        const val TABLE_ORDERS = "orders_history"
        const val COLUMN_ORDER_ID = "id"
        const val COLUMN_KODE_PESANAN = "kode_pesanan"
        const val COLUMN_CUSTOMER_NAME = "customer_name"
        const val COLUMN_CUSTOMER_PHONE = "customer_phone"
        const val COLUMN_ALAMAT = "alamat"
        const val COLUMN_CATATAN = "catatan"
        const val COLUMN_TANGGAL_AMBIL = "tanggal_ambil"
        const val COLUMN_TOTAL_PRICE = "total_price"
        const val COLUMN_STATUS = "status"
        const val COLUMN_CREATED_AT = "created_at"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createCartTable = """
            CREATE TABLE $TABLE_CART (
                $COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COLUMN_PRODUCT_ID INTEGER NOT NULL,
                $COLUMN_NAME TEXT NOT NULL,
                $COLUMN_CATEGORY TEXT NOT NULL,
                $COLUMN_PRICE REAL NOT NULL,
                $COLUMN_QUANTITY INTEGER NOT NULL,
                $COLUMN_IMAGE_RES INTEGER NOT NULL,
                $COLUMN_NOTES TEXT DEFAULT ''
            )
        """.trimIndent()

        val createOrdersTable = """
            CREATE TABLE $TABLE_ORDERS (
                $COLUMN_ORDER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COLUMN_KODE_PESANAN TEXT UNIQUE NOT NULL,
                $COLUMN_CUSTOMER_NAME TEXT NOT NULL,
                $COLUMN_CUSTOMER_PHONE TEXT NOT NULL,
                $COLUMN_ALAMAT TEXT NOT NULL,
                $COLUMN_CATATAN TEXT DEFAULT '',
                $COLUMN_TANGGAL_AMBIL TEXT NOT NULL,
                $COLUMN_TOTAL_PRICE REAL NOT NULL,
                $COLUMN_STATUS TEXT DEFAULT 'pending',
                $COLUMN_CREATED_AT TEXT NOT NULL
            )
        """.trimIndent()

        db.execSQL(createCartTable)
        db.execSQL(createOrdersTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            val createOrdersTable = """
                CREATE TABLE IF NOT EXISTS $TABLE_ORDERS (
                    $COLUMN_ORDER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    $COLUMN_KODE_PESANAN TEXT UNIQUE NOT NULL,
                    $COLUMN_CUSTOMER_NAME TEXT NOT NULL,
                    $COLUMN_CUSTOMER_PHONE TEXT NOT NULL,
                    $COLUMN_ALAMAT TEXT NOT NULL,
                    $COLUMN_CATATAN TEXT DEFAULT '',
                    $COLUMN_TANGGAL_AMBIL TEXT NOT NULL,
                    $COLUMN_TOTAL_PRICE REAL NOT NULL,
                    $COLUMN_STATUS TEXT DEFAULT 'pending',
                    $COLUMN_CREATED_AT TEXT NOT NULL
                )
            """.trimIndent()
            db.execSQL(createOrdersTable)
        }
        if (oldVersion < 3) {
            try {
                db.execSQL("ALTER TABLE $TABLE_ORDERS ADD COLUMN $COLUMN_CATATAN TEXT DEFAULT ''")
            } catch (_: Exception) {
            }
        }
    }

    // --- MANAJEMEN KERANJANG (CART) ---

    fun addToCart(product: Product, quantityToAdd: Int = 1): Boolean {
        val db = writableDatabase
        val cursor = db.query(
            TABLE_CART,
            arrayOf(COLUMN_ID, COLUMN_QUANTITY),
            "$COLUMN_PRODUCT_ID = ?",
            arrayOf(product.id.toString()),
            null, null, null
        )

        var success = false
        if (cursor.moveToFirst()) {
            val existingId = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_ID))
            val currentQty = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_QUANTITY))
            val newQty = currentQty + quantityToAdd

            val values = ContentValues().apply {
                put(COLUMN_QUANTITY, newQty)
            }
            val rows = db.update(TABLE_CART, values, "$COLUMN_ID = ?", arrayOf(existingId.toString()))
            success = rows > 0
        } else {
            val values = ContentValues().apply {
                put(COLUMN_PRODUCT_ID, product.id)
                put(COLUMN_NAME, product.name)
                put(COLUMN_CATEGORY, product.category)
                put(COLUMN_PRICE, product.price)
                put(COLUMN_QUANTITY, quantityToAdd)
                put(COLUMN_IMAGE_RES, product.imageRes)
                put(COLUMN_NOTES, "")
            }
            val id = db.insert(TABLE_CART, null, values)
            success = id != -1L
        }
        cursor.close()
        return success
    }

    fun getAllCartItems(): List<CartItem> {
        val items = mutableListOf<CartItem>()
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_CART ORDER BY $COLUMN_ID DESC", null)

        if (cursor.moveToFirst()) {
            do {
                val item = CartItem(
                    id = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_ID)),
                    productId = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_PRODUCT_ID)),
                    name = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_NAME)),
                    category = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CATEGORY)),
                    price = cursor.getDouble(cursor.getColumnIndexOrThrow(COLUMN_PRICE)),
                    quantity = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_QUANTITY)),
                    imageRes = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_IMAGE_RES)),
                    notes = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_NOTES)) ?: ""
                )
                items.add(item)
            } while (cursor.moveToNext())
        }
        cursor.close()
        return items
    }

    fun updateQuantity(cartId: Int, newQuantity: Int): Boolean {
        if (newQuantity <= 0) {
            return deleteItem(cartId)
        }
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_QUANTITY, newQuantity)
        }
        val rows = db.update(TABLE_CART, values, "$COLUMN_ID = ?", arrayOf(cartId.toString()))
        return rows > 0
    }

    fun deleteItem(cartId: Int): Boolean {
        val db = writableDatabase
        val rows = db.delete(TABLE_CART, "$COLUMN_ID = ?", arrayOf(cartId.toString()))
        return rows > 0
    }

    fun clearCart(): Boolean {
        val db = writableDatabase
        val rows = db.delete(TABLE_CART, null, null)
        return rows >= 0
    }

    fun getTotalPrice(): Double {
        var total = 0.0
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT SUM($COLUMN_PRICE * $COLUMN_QUANTITY) FROM $TABLE_CART", null)
        if (cursor.moveToFirst()) {
            total = cursor.getDouble(0)
        }
        cursor.close()
        return total
    }

    fun getTotalItemCount(): Int {
        var count = 0
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT SUM($COLUMN_QUANTITY) FROM $TABLE_CART", null)
        if (cursor.moveToFirst()) {
            count = cursor.getInt(0)
        }
        cursor.close()
        return count
    }

    // --- MANAJEMEN RIWAYAT PESANAN (ORDERS) ---

    fun saveOrder(order: Order): Boolean {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_KODE_PESANAN, order.orderCode)
            put(COLUMN_CUSTOMER_NAME, order.customerName)
            put(COLUMN_CUSTOMER_PHONE, order.customerPhone)
            put(COLUMN_ALAMAT, order.address)
            put(COLUMN_CATATAN, order.notes)
            put(COLUMN_TANGGAL_AMBIL, order.pickupDate)
            put(COLUMN_TOTAL_PRICE, order.totalPrice)
            put(COLUMN_STATUS, order.status)
            put(COLUMN_CREATED_AT, order.createdAt)
        }
        val id = db.insert(TABLE_ORDERS, null, values)
        return id != -1L
    }

    fun getAllOrders(): List<Order> {
        val orders = mutableListOf<Order>()
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_ORDERS ORDER BY $COLUMN_ORDER_ID DESC", null)

        if (cursor.moveToFirst()) {
            do {
                val order = Order(
                    id = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_ORDER_ID)),
                    orderCode = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_KODE_PESANAN)),
                    customerName = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CUSTOMER_NAME)),
                    customerPhone = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CUSTOMER_PHONE)),
                    address = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_ALAMAT)),
                    notes = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CATATAN)) ?: "",
                    pickupDate = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_TANGGAL_AMBIL)),
                    totalPrice = cursor.getDouble(cursor.getColumnIndexOrThrow(COLUMN_TOTAL_PRICE)),
                    status = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_STATUS)),
                    createdAt = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CREATED_AT))
                )
                orders.add(order)
            } while (cursor.moveToNext())
        }
        cursor.close()
        return orders
    }

    fun getLatestOrder(): Order? {
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_ORDERS ORDER BY $COLUMN_ORDER_ID DESC LIMIT 1", null)
        var order: Order? = null
        if (cursor.moveToFirst()) {
            order = Order(
                id = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_ORDER_ID)),
                orderCode = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_KODE_PESANAN)),
                customerName = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CUSTOMER_NAME)),
                customerPhone = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CUSTOMER_PHONE)),
                address = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_ALAMAT)),
                notes = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CATATAN)) ?: "",
                pickupDate = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_TANGGAL_AMBIL)),
                totalPrice = cursor.getDouble(cursor.getColumnIndexOrThrow(COLUMN_TOTAL_PRICE)),
                status = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_STATUS)),
                createdAt = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CREATED_AT))
            )
        }
        cursor.close()
        return order
    }

    fun getOrderByCode(orderCode: String): Order? {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT * FROM $TABLE_ORDERS WHERE LOWER($COLUMN_KODE_PESANAN) = LOWER(?) LIMIT 1",
            arrayOf(orderCode.trim())
        )
        var order: Order? = null
        if (cursor.moveToFirst()) {
            order = Order(
                id = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_ORDER_ID)),
                orderCode = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_KODE_PESANAN)),
                customerName = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CUSTOMER_NAME)),
                customerPhone = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CUSTOMER_PHONE)),
                address = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_ALAMAT)),
                notes = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CATATAN)) ?: "",
                pickupDate = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_TANGGAL_AMBIL)),
                totalPrice = cursor.getDouble(cursor.getColumnIndexOrThrow(COLUMN_TOTAL_PRICE)),
                status = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_STATUS)),
                createdAt = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_CREATED_AT))
            )
        }
        cursor.close()
        return order
    }

    fun updateOrderStatus(orderCode: String, newStatus: String): Boolean {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_STATUS, newStatus)
        }
        val rows = db.update(TABLE_ORDERS, values, "LOWER($COLUMN_KODE_PESANAN) = LOWER(?)", arrayOf(orderCode.trim()))
        return rows > 0
    }
}
