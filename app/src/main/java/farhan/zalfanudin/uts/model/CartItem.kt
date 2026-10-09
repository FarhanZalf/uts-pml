package farhan.zalfanudin.uts.model

data class CartItem(
    val id: Int,
    val productId: Int,
    val name: String,
    val category: String,
    val price: Double,
    var quantity: Int,
    val imageRes: Int,
    var notes: String = ""
)
