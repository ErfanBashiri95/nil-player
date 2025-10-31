import { useEffect, useState } from "react";
import StarOverlay from "../components/StarOverlay";
import MediaModal from "../components/MediaModal";
import "../styles/helix01.css";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Helix01() {
  const { user } = useAuth();
  const [modal, setModal] = useState(null); // { type,url,title, sessionId, initialTime }
  const [sessions, setSessions] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // { [session_id]: {percent, last_position, completed} }

  const openMedia = (type, url, title, sessionId) => {
    const p = progressMap[sessionId];
    const initialTime = p?.last_position ? Number(p.last_position) : 0;
    setModal({ type, url, title, sessionId, initialTime, courseCode: "HELIX01" });
  };
  const closeModal = () => setModal(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // جلسات
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("nilplayer_sessions")
        .select("id, title, desc:desc, video_url, audio_url, order_index")
        .eq("course_code", "HELIX01")
        .order("order_index", { ascending: true });

      if (!error && data) {
        setSessions(
          data.map((s) => ({
            id: s.id,
            title: s.title,
            desc: s.desc,
            videoUrl: s.video_url,
            audioUrl: s.audio_url,
          }))
        );
      } else {
        console.error("fetch sessions error:", error);
      }
    })();
  }, []);

  // پیشرفت کاربر
  useEffect(() => {
    if (!user || sessions.length === 0) return;
    (async () => {
      const ids = sessions.map((s) => s.id);
      const { data, error } = await supabase
        .from("nilplayer_progress")
        .select("session_id, watched_seconds, total_seconds, completed, last_position")
        .eq("username", user.username)
        .in("session_id", ids);

      if (error) {
        console.error("fetch progress error:", error);
        return;
      }

      const map = {};
      for (const r of data || []) {
        const total = Number(r.total_seconds || 0);
        const base = Number(r.watched_seconds || r.last_position || 0);
        const percent = total > 0 ? Math.min(100, Math.round((base / total) * 100)) : 0;
        map[r.session_id] = {
          percent,
          last_position: Number(r.last_position || 0),
          completed: !!r.completed,
        };
      }
      setProgressMap(map);
    })();
  }, [user, sessions]);

  // آیکن‌های SVG کوچک
  const IconVideo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ marginInlineStart: 4 }}>
      <path fill="currentColor" d="M15 8v8H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h10zm2 .5l4-2.25v10.5L17 14.5z"/>
    </svg>
  );
  const IconAudio = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ marginInlineStart: 4 }}>
      <path fill="currentColor" d="M12 3a4 4 0 0 0-4 4v5a4 4 0 1 0 8 0V7a4 4 0 0 0-4-4zm-7 9a1 1 0 1 0-2 0 9 9 0 0 0 8 8.94V21a1 1 0 1 0-2 0v-.06A7 7 0 0 1 5 12zm16-1a1 1 0 0 1 2 0 9 9 0 0 1-8 8.94V21a1 1 0 0 1-2 0v-.06A7 7 0 0 0 21 11z"/>
    </svg>
  );

  return (
    <div className="helix-page">
      <div className="helix-bg" />
      {/* ⭐️ فقط نیمه بالایی صفحه: ماسک روی StarOverlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 50%, transparent 50%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 50%, transparent 50%, transparent 100%)",
          zIndex: 1
        }}
      >
        <StarOverlay />
      </div>
      <div className="helix-aurora" />
      <div className="helix-shade" />

      <main className="helix-content">
        <section className="helix-hero">
          <h1 className="helix-title">دوره فراگیری مربی‌گری مدار هِلیکس ۰۱</h1>
          <p className="helix-subtitle">ویدئوهای ضبط‌شده و پادکست‌های جلسات</p>
        </section>

        <section className="sessions-wrap">
          <div className="sessions-strip">
            {sessions.map((s) => {
              const p = progressMap[s.id];
              const percent = p?.percent ?? 0;
              const done = !!p?.completed || percent === 100;
              return (
                <article className="session-card" key={s.id} style={{ position: "relative" }}>
                  {/* Badge پیشرفت */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#fff",
                      background: done
                        ? "linear-gradient(90deg,#16a34a,#22c55e)"
                        : "rgba(255,255,255,.18)",
                      border: "1px solid rgba(255,255,255,.28)",
                      backdropFilter: "blur(4px)",
                    }}
                    title={done ? "کامل دیده شده" : "درصد تماشا"}
                  >
                    {done ? "✓ کامل" : `${percent}%`}
                  </div>

                  <h3 className="session-title">{s.title}</h3>
                  <p className="session-desc">{s.desc}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => openMedia("video", s.videoUrl, s.title, s.id)}
                    >
                      <IconVideo /> ویدئو
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => openMedia("audio", s.audioUrl, s.title, s.id)}
                    >
                      <IconAudio /> پادکست
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {modal && (
        <MediaModal
          open={!!modal}
          onClose={closeModal}
          type={modal.type}
          url={modal.url}
          title={modal.title}
          sessionId={modal.sessionId}
          initialTime={modal.initialTime}
          courseCode={modal.courseCode}
        />
      )}
    </div>
  );
}
