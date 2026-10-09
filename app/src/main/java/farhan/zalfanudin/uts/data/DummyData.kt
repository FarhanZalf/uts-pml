package farhan.zalfanudin.uts.data

import farhan.zalfanudin.uts.R
import farhan.zalfanudin.uts.model.Category
import farhan.zalfanudin.uts.model.Product

object DummyData {

    // Kategori Resmi sesuai tabel categories di MySQL Erles Bakery
    val categories = listOf(
        Category(0, "Semua Kategori"),
        Category(1, "Roti"),
        Category(2, "Kue"),
        Category(3, "Kue Kering"),
        Category(4, "Hampers")
    )

    // Produk sesuai kategori resmi dan data database Erles Bakery
    val products = listOf(
        Product(
            id = 1,
            name = "Roti Tawar Gandum",
            category = "Roti",
            price = 25000.0,
            stock = 50,
            description = "Roti tawar gandum utuh, lembut, berserat tinggi, dan sehat untuk sarapan.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 2,
            name = "Butter Croissant Klasik",
            category = "Roti",
            price = 18000.0,
            stock = 25,
            description = "Pastry croissant berlapis renyah dengan aroma mentega murni Prancis khas Erles.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 3,
            name = "Roti Sobek Cokelat Lumer",
            category = "Roti",
            price = 16000.0,
            stock = 30,
            description = "Roti sobek lembut dengan isian cokelat lumer manis gurih yang melimpah.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 4,
            name = "Red Velvet Slice Cake",
            category = "Kue",
            price = 28000.0,
            stock = 15,
            description = "Kue tart red velvet lembut dilapisi krim keju spesial yang lumer di mulut.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 5,
            name = "Black Forest Mini Tart",
            category = "Kue",
            price = 35000.0,
            stock = 10,
            description = "Kue tart cokelat klasik dengan taburan dark chocolate serut dan ceri segar.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 6,
            name = "Nastar Nanas Butter Wijsman",
            category = "Kue Kering",
            price = 65000.0,
            stock = 20,
            description = "Kue kering nastar lembut dengan selai nanas asli segar dan butter wijsman harum.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 7,
            name = "Kastengel Keju Edam Gurih",
            category = "Kue Kering",
            price = 70000.0,
            stock = 18,
            description = "Kue kering keju edam asli Belanda yang gurih renyah dan lumer saat dikunyah.",
            imageRes = R.drawable.ic_bakery_item
        ),
        Product(
            id = 8,
            name = "Hampers Spesial Erles Bakery",
            category = "Hampers",
            price = 145000.0,
            stock = 8,
            description = "Paket hampers cantik berisi kombinasi aneka roti manis, kue kering, dan kartu ucapan.",
            imageRes = R.drawable.ic_bakery_item
        )
    )
}
