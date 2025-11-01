import { useEffect, useState, useCallback, useRef } from "react";
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

  // جلوگیری از دوبار رفرش ناخواسته
  const didAutoKickRef = useRef(false);

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

  // فقط با username + course_code می‌گیریم
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

  const closeModal = () => {
    setModal(null);
    reloadProgress();
  };

  // ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  // جلسات + بک‌گراند
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
      setTimeout(() => setReady(true), 50);
    })();
  }, []);

  // ❗️روی تغییر user فوراً بگیریم (بدون اتکا به Supabase Auth)
  useEffect(() => {
    if (user?.username) reloadProgress();
    else setProgressMap({});
  }, [user?.username, reloadProgress]);

  // لیسنر ایونت‌های داخلی AuthContext
  useEffect(() => {
    const onUserChanged = () => reloadProgress();
    const onLoggedOut = () => setProgressMap({});
    window.addEventListener("nil:user-changed", onUserChanged);
    window.addEventListener("nil:user-logged-out", onLoggedOut);
    return () => {
      window.removeEventListener("nil:user-changed", onUserChanged);
      window.removeEventListener("nil:user-logged-out", onLoggedOut);
    };
  }, [reloadProgress]);

  // پولینگ ملایم
  useEffect(() => {
    const id = setInterval(() => reloadProgress(), 10000);
    return () => clearInterval(id);
  }, [reloadProgress]);

  // ⚙️ One-shot refresh بعد از اولین آماده شدن صفحه + حضور user
  useEffect(() => {
    if (!didAutoKickRef.current && ready && user?.username) {
      didAutoKickRef.current = true;
      // کمی تاخیر تا DOM/Context کامل پایدار شود
      setTimeout(() => { reloadProgress(); }, 0);
    }
  }, [ready, user?.username, reloadProgress]);

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
                      <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1, marginLeft: 6 }}>🎬</span>
                      {STR("video")}
                    </button>
                    <button className="btn btn-ghost" onClick={() => openMedia("audio", s.audioUrl, s.title, s.id)}>
                      <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1, marginLeft: 6 }}>🎧</span>
                      {STR("podcast")}
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
