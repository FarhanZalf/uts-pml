package farhan.zalfanudin.uts.model

data class Order(
    val id: Int = 0,
    val orderCode: String,
    val customerName: String,
    val customerPhone: String,
    val address: String,
    val notes: String = "",
    val pickupDate: String,
    val totalPrice: Double,
    val status: String = "pending",
    val createdAt: String
) {
    val isPickup: Boolean
        get() = address.startsWith("Outlet Erles Bakery", ignoreCase = true)
}
