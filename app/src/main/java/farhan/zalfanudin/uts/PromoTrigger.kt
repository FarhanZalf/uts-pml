package farhan.zalfanudin.uts

import android.content.Context
import android.os.SystemClock
import android.util.Log
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.inappmessaging.FirebaseInAppMessaging

/**
 * Helper object untuk memicu kampanye Firebase In-App Messaging secara terprogram
 * setiap kali aplikasi dibuka (onResume), dengan pembatasan interval (debounce) minimal 2 detik.
 */
object PromoTrigger {

    private const val TAG = "PromoTrigger"
    const val EVENT_NAME = "promo_app_open"
    private const val THROTTLE_INTERVAL_MS = 2000L

    private var lastTriggerTimestampMs: Long = 0L

    fun fire(context: Context) {
        val now = SystemClock.elapsedRealtime()
        if (now - lastTriggerTimestampMs < THROTTLE_INTERVAL_MS) {
            Log.d(TAG, "PromoTrigger dilewati: jeda onResume kurang dari 2 detik.")
            return
        }

        try {
            // (a) Pastikan In-App Messaging tidak dalam status suppressed
            val iam = FirebaseInAppMessaging.getInstance()
            iam.setMessagesSuppressed(false)

            // (b) Picu event terprogram ke Firebase In-App Messaging
            iam.triggerEvent(EVENT_NAME)

            // (c) Catat event ke Firebase Analytics
            FirebaseAnalytics.getInstance(context).logEvent(EVENT_NAME, null)

            lastTriggerTimestampMs = now
            Log.d(TAG, "PromoTrigger fired")
        } catch (e: Exception) {
            Log.w(TAG, "Gagal mengeksekusi PromoTrigger: ${e.message}", e)
        }
    }
}
