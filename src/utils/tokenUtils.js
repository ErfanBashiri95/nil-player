// src/utils/tokenUtils.js
// ✅ تا وقتی لینک‌ها عادی‌ان، خطا نده.
// - اگر پارامتر exp وجود داشت و گذشته بود ⇒ منقضی.
// - اگر exp نبود ⇒ معتبر فرض کن.
// - می‌تونی با VITE_DISABLE_URL_VALIDATION=true کلاً چک رو غیرفعال کنی.

export function validateSecureURL(url) {
    // بایپس موقت با env
    if (import.meta.env.VITE_DISABLE_URL_VALIDATION === "true") return true;
  
    try {
      const u = new URL(url, window.location.href);
  
      // اگر exp نداریم، الان معتبر حساب کن (برای لینک‌های ساده‌ی فعلی)
      const exp = u.searchParams.get("exp");
      if (!exp) return true;
  
      const now = Math.floor(Date.now() / 1000);
      return Number(exp) > now;
    } catch {
      // اگر parsing خطا داد، سخت‌گیری نکن
      return true;
    }
  }
  