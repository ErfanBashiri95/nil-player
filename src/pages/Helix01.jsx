import { useEffect, useState } from "react";
import StarOverlay from "../components/StarOverlay";
import MediaModal from "../components/MediaModal";
import "../styles/helix01.css";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

/* جدیدها */
import HeaderBar from "../components/HeaderBar";
import PageLoader from "../components/PageLoader";
import { preloadImage } from "../utils/preload";
import { STR } from "../i18n/lang";

export default function Helix01() {
  const { user } = useAuth();

  // مودال پخش
  const [modal, setModal] = useState(null); // { type,url,title, sessionId, initialTime, courseCode }

  // داده‌های صفحه
  const [sessions, setSessions] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // { [session_id]: {percent, last_position, completed} }

  // لودر صفحه
  const [ready, setReady] = useState(false);

  const openMedia = (type, url, title, sessionId) => {
    const p = progressMap[sessionId];
    const initialTime = p?.last_position ? Number(p.last_position) : 0;
    setModal({ type, url, title, sessionId, initialTime, courseCode: "HELIX01" });
  };
  const closeModal = () => setModal(null);

  // ESC برای بستن
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // خواندن جلسات + پیش‌لود بک‌گراند + آماده‌سازی صفحه
  useEffect(() => {
    (async () => {
      const [_, { data, error }] = await Promise.all([
        preloadImage("/assets/helix01_bg.png"),
        supabase
          .from("nilplayer_sessions")
          .select("id, title, desc:desc, video_url, audio_url, order_index")
          .eq("course_code", "HELIX01")
          .order("order_index", { ascending: true }),
      ]);

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

      // یک مکث خیلی کوتاه برای جاافتادن فونت/استایل
      setTimeout(() => setReady(true), 100);
    })();
  }, []);

  // --- ADD: یک تابع واحد برای خواندن پرگرس ---
  async function fetchProgress(currentUser = user, currentSessions = sessions) {
    if (!currentUser || !currentSessions?.length) return;
    const ids = currentSessions.map((s) => s.id);
    const { data, error } = await supabase
      .from("nilplayer_progress")
      .select("session_id, watched_seconds, total_seconds, completed, last_position")
      .eq("username", currentUser.username)
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
  }

  // خواندن پیشرفت کاربر برای همین دوره و ساخت map (فراخوانی اولیه)
  useEffect(() => {
    fetchProgress(user, sessions);
  }, [user, sessions]);

  // --- ADD: رفرش فوری بدون رفرش صفحه (گوش‌دادن به رویداد)
  useEffect(() => {
    const onUpd = () => fetchProgress(user, sessions);
    window.addEventListener("nilplayer:progress-updated", onUpd);
    return () => window.removeEventListener("nilplayer:progress-updated", onUpd);
  }, [user, sessions]);

  return (
    <div className="helix-page">
      {/* هدر ثابت: خروج + EN/FA */}
      <HeaderBar />

      <div className="helix-bg" />
      {/* اگر قبلاً محدود کرده‌ای به نیمهٔ بالا، همین StarOverlay را داخل یک ظرف 50vh بگذار */}
      <StarOverlay />
      <div className="helix-aurora" />
      <div className="helix-shade" />

      <main className="helix-content" style={{ visibility: ready ? "visible" : "hidden" }}>
        <section className="helix-hero">
          <h1 className="helix-title">{STR("helix01_title")}</h1>
          <p className="helix-subtitle">{STR("subtitle")}</p>
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

                  {/* فقط ویدئو - دکمه پادکست حذف شده */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => openMedia("video", s.videoUrl, s.title, s.id)}
                    >
                      <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1, marginLeft: 6 }}>🎬</span>
                      {STR("video")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* لودر تمام‌صفحه */}
      <PageLoader show={!ready} />

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
