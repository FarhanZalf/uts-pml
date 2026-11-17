package farhan.zalfanudin.uts.data

import farhan.zalfanudin.uts.R
import farhan.zalfanudin.uts.model.Category
import farhan.zalfanudin.uts.model.Product

object DummyData {

    // Kategori Resmi sesuai database MySQL/PostgreSQL Erles Bakery
    val categories = listOf(
        Category(0, "Semua Kategori"),
        Category(1, "Roti Manis"),
        Category(2, "Donat")
    )

    // Produk sesuai katalog resmi toko Erles Bakery (Owner: Bu Erni Lestari)
    val products = listOf(
        Product(
            id = 1,
            name = "Roti Abon",
            category = "Roti Manis",
            price = 5000.0,
            stock = 50,
            description = "Roti manis empuk bertabur abon sapi gurih melimpah dengan olesan saus manis khas bakery.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 2,
            name = "Roti Sosis",
            category = "Roti Manis",
            price = 5000.0,
            stock = 50,
            description = "Roti lembut dengan isian sosis sapi pilihan berpadu saus gurih favorit sarapan keluarga.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 3,
            name = "Roti Keju",
            category = "Roti Manis",
            price = 5000.0,
            stock = 40,
            description = "Roti manis lembut berisikan keju gurih dengan parutan keju cheddar panggang di atasnya.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 4,
            name = "Roti Pizza",
            category = "Roti Manis",
            price = 5000.0,
            stock = 40,
            description = "Roti mini pizza dengan topping potongan sosis, saus tomat rempah, dan taburan keju leleh.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 5,
            name = "Roti Sakura",
            category = "Roti Manis",
            price = 5000.0,
            stock = 35,
            description = "Roti manis klasik dibentuk kelopak bunga sakura yang cantik dan harum mentega segar.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 6,
            name = "Roti Kepang",
            category = "Roti Manis",
            price = 5000.0,
            stock = 35,
            description = "Roti kepang tradisional dengan olesan mentega manis dan taburan gula pasir renyah.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 7,
            name = "Roti Pisang Coklat",
            category = "Roti Manis",
            price = 5000.0,
            stock = 50,
            description = "Kombinasi klasik pisang raja manis alami dan lelehan cokelat legit berbalut adonan roti empuk.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 8,
            name = "Roti Pisang Coklat Keju",
            category = "Roti Manis",
            price = 6000.0,
            stock = 45,
            description = "Perpaduan sempurna pisang manis, lelehan cokelat lumer, dan keju cheddar gurih dalam satu roti.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 9,
            name = "Roti Abon 1 Loyang (40 x 40)",
            category = "Roti Manis",
            price = 60000.0,
            stock = 15,
            description = "Porsi besar 1 loyang ukuran 40 × 40 cm penuh abon sapi tebal, sangat cocok untuk hantaran dan acara keluarga.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 10,
            name = "Donuts Biasa",
            category = "Donat",
            price = 2500.0,
            stock = 60,
            description = "Donat kentang tradisional super empuk dan kenyal, ditaburi gula halus dingin yang manis pas.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 11,
            name = "Donuts Meses Coklat",
            category = "Donat",
            price = 5000.0,
            stock = 50,
            description = "Donat empuk dengan olesan krim manis lembut dan taburan meses cokelat tebal yang melimpah.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 12,
            name = "Donuts Premium",
            category = "Donat",
            price = 7000.0,
            stock = 40,
            description = "Donat kentang premium bertekstur lembut istimewa dengan pilihan topping glaze artisan cokelat dan keju.",
            imageRes = R.drawable.ic_bakery_item
        )
    )
}
