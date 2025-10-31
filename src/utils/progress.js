import { supabase } from "../lib/supabaseClient";

// محافظ در برابر هم‌زمانی و ازدحام آپدیت‌ها
let inFlight = false;
let lastPayload = null;

export async function saveProgress({
  username,
  courseCode,
  sessionId,
  lastPosition, // ثانیه جاری
  watchedSeconds, // بیشینه زمانی که واقعاً دیده شده
  totalSeconds, // مدت ویدئو
  completed, // true/false
}) {
  // اگر هنوز مدت نداریم، صرفاً موقعیت را نگه ندار
  if (!username || !sessionId) return;

  // اگر ایندکس یکتا ساختی:
  const payload = {
    username,
    course_code: courseCode,
    session_id: sessionId,
    last_position: Math.max(0, Math.floor(lastPosition || 0)),
    watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
    total_seconds: Math.max(0, Math.floor(totalSeconds || 0)),
    completed: !!completed,
    updated_at: new Date().toISOString(),
  };

  lastPayload = payload;
  if (inFlight) return; // بگذار درخواست قبلی تمام شود

  inFlight = true;
  try {
    // upsert روی کلید یکتا (username, session_id)
    const { error } = await supabase
      .from("nilplayer_progress")
      .upsert(payload, { onConflict: "username,session_id" });

    if (error) console.error("saveProgress upsert error:", error);
  } finally {
    inFlight = false;
    // اگر در حین درخواست، داده‌ی جدیدتری آمد، دوباره ذخیره کن
    if (lastPayload && (lastPayload.updated_at !== payload.updated_at)) {
      const lp = lastPayload; lastPayload = null;
      await saveProgress(lp);
    } else {
      lastPayload = null;
    }
  }
}
