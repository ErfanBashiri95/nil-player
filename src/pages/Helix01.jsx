import { useEffect, useState, useCallback } from "react";
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
import { getProgress } from "../utils/progress";

export default function Helix01() {
  const { user } = useAuth();
  const [modal, setModal] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [ready, setReady] = useState(false);

  const openMedia = async (type, url, title, sessionId) => {
    let initialTime = 0;
    if (type === "video") {
      const p = progressMap[sessionId];
      if (p?.last_position > 0) {
        initialTime = Number(p.last_position);
      } else if (user?.username) {
        const { data } = await getProgress(user.username, sessionId);
        initialTime = Number(data?.last_position || 0);
      }
    }
    setModal({ type, url, title, sessionId, initialTime, courseCode: "HELIX01" });
  };

  // دریافت درصد پیشرفت از Supabase
  const reloadProgress = useCallback(async () => {
    if (!user?.username) return;
    const { data, error } = await supabase
      .from("nilplayer_progress")
      .select("session_id, watched_seconds, total_seconds, completed, last_position")
      .eq("username", user.username)
      .eq("course_code", "HELIX01");

    if (error) { console.error("fetch progress error:", error); return; }

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
  }, [user?.username]);

  // 🔹 هنگامی که user تغییر می‌کند
  useEffect(() => {
    if (user?.username) reloadProgress();
    else setProgressMap({});
  }, [user?.username, reloadProgress]);

  // 🔹 گوش دادن به تغییرات login/logout و رفرش اتومات
  useEffect(() => {
    const onAuthLogin = () => reloadProgress();
    const onAuthLogout = () => setProgressMap({});

    window.addEventListener("nil-auth:login", onAuthLogin);
    window.addEventListener("nil-auth:logout", onAuthLogout);
    window.addEventListener("focus", reloadProgress);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reloadProgress();
    });

    // وقتی localStorage بین تب‌ها عوض می‌شود
    const onStorage = (e) => {
      if (e.key === "nil_auth") reloadProgress();
    };
    window.addEventListener("storage", onStorage);

    reloadProgress();

    return () => {
      window.removeEventListener("nil-auth:login", onAuthLogin);
      window.removeEventListener("nil-auth:logout", onAuthLogout);
      window.removeEventListener("focus", reloadProgress);
      document.removeEventListener("visibilitychange", reloadProgress);
      window.removeEventListener("storage", onStorage);
    };
  }, [reloadProgress]);

  const closeModal = () => {
    setModal(null);
    reloadProgress();
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  // گرفتن جلسات و بک‌گراند
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
        setSessions(data.map((s) => ({
          id: s.id, title: s.title, desc: s.desc,
          videoUrl: s.video_url, audioUrl: s.audio_url,
        })));
      }
      setTimeout(() => setReady(true), 100);
    })();
  }, []);

  return (
    <div className="helix-page">
      <HeaderBar />
      <div className="helix-bg" />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50vh", overflow: "hidden", zIndex: 1, pointerEvents: "none" }}>
        <StarOverlay />
      </div>
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
                  <div
                    style={{
                      position: "absolute", top: 8, left: 8, display: "inline-flex",
                      alignItems: "center", gap: 6, padding: "4px 8px",
                      borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#fff",
                      background: done ? "linear-gradient(90deg,#16a34a,#22c55e)" : "rgba(255,255,255,.18)",
                      border: "1px solid rgba(255,255,255,.28)", backdropFilter: "blur(4px)",
                    }}
                    title={done ? "کامل دیده شده" : "درصد تماشا (فقط ویدئو)"}
                  >
                    {done ? "✓ کامل" : `${percent}%`}
                  </div>

                  <h3 className="session-title">{s.title}</h3>
                  <p className="session-desc">{s.desc}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => openMedia("video", s.videoUrl, s.title, s.id)}>
                      🎬 {STR("video")}
                    </button>
                    <button className="btn btn-ghost" onClick={() => openMedia("audio", s.audioUrl, s.title, s.id)}>
                      🎧 {STR("podcast")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

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
