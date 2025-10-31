import { supabase } from "../lib/supabaseClient";

// اگر هنوز ایندکس یکتا نداری، بهتره بسازی:
// ALTER TABLE nilplayer_progress ADD CONSTRAINT uniq_user_session UNIQUE (username, session_id);

export async function saveProgress({
  username,
  courseCode,
  sessionId,
  lastPosition = 0,
  watchedSeconds = 0,
  totalSeconds = 0,
  completed = false,
}) {
  if (!username || !sessionId) return { error: "missing keys" };

  const payload = {
    username,
    course_code: courseCode,
    session_id: sessionId,
    last_position: Math.floor(lastPosition || 0),
    watched_seconds: Math.floor(watchedSeconds || 0),
    total_seconds: Math.floor(totalSeconds || 0),
    completed: !!completed,
    // updated_at: server default now()
  };

  const { data, error } = await supabase
    .from("nilplayer_progress")
    .upsert(payload, { onConflict: "username,session_id" });

  return { data, error };
}

export async function getProgress(username, sessionId) {
  if (!username || !sessionId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("nilplayer_progress")
    .select("last_position, watched_seconds, total_seconds, completed")
    .eq("username", username)
    .eq("session_id", sessionId)
    .maybeSingle();
  return { data, error };
}
