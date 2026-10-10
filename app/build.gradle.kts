plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "farhan.zalfanudin.uts"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "farhan.zalfanudin.uts"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.core.ktx)
    implementation(libs.material)

    // Generator QR-Code tiket pengambilan pesanan kasir
    implementation("com.google.zxing:core:3.5.3")

    // OpenStreetMap (OSM) peta lokasi toko & pengantaran
    implementation("org.osmdroid:osmdroid-android:6.1.18")

    // Pustaka Volley untuk konsumsi HTTP REST API backend Laravel (Poin UTS #19: Volley 1% & #18: MySQL Web Service 2%)
    implementation("com.android.volley:volley:1.2.1")

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
}