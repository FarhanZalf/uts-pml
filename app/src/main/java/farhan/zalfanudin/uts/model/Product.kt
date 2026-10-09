package farhan.zalfanudin.uts.model

data class Product(
    val id: Int,
    val name: String,
    val category: String,
    val price: Double,
    val stock: Int,
    val description: String,
    val imageRes: Int
)
