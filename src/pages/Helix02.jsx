import { useEffect, useState, useCallback } from "react";
import "../styles/helix02.css";
import StarOverlay from "../components/StarOverlay";
import MediaModal from "../components/MediaModal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import HeaderBar from "../components/HeaderBar";
import PageLoader from "../components/PageLoader";
import { preloadImage } from "../utils/preload";
import { STR } from "../i18n/lang";

export default function Helix02() {
  const { user } = useAuth();

  const [modal, setModal] = useState(null); // { type,url,title, sessionId, initialTime, courseCode }
  const [sessions, setSessions] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [ready, setReady] = useState(false);

  const openMedia = (type, url, title, sessionId) => {
    const p = progressMap[sessionId];
    const initialTime = p?.last_position ? Number(p.last_position) : 0; // فقط برای ویدئو
    setModal({ type, url, title, sessionId, initialTime, courseCode: "HELIX02" });
  };

  const reloadProgress = useCallback(async () => {
    if (!user || sessions.length === 0) return;
    const ids = sessions.map((s) => s.id);
    const { data, error } = await supabase
      .from("nilplayer_progress")
      .select("session_id, watched_seconds, total_seconds, completed, last_position, media_type")
      .eq("username", user.username)
      .in("session_id", ids);

    if (error) { console.error("fetch progress error:", error); return; }

    const map = {};
    for (const r of data || []) {
      const total = Number(r.total_seconds || 0);
      const base = Number(r.watched_seconds || r.last_position || 0);
      const isVideoRow = r.media_type ? r.media_type === "video" : true;
      const percent = isVideoRow && total > 0 ? Math.min(100, Math.round((base / total) * 100)) : 0;
      map[r.session_id] = {
        percent,
        last_position: Number(r.last_position || 0),
        completed: !!r.completed && isVideoRow,
      };
    }
    setProgressMap(map);
  }, [user, sessions]);

  const closeModal = () => { setModal(null); reloadProgress(); };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.allSettled([preloadImage("/assets/helix02_bg.png")]);
      const { data, error } = await supabase
        .from("nilplayer_sessions")
        .select("id, title, desc:desc, video_url, audio_url, order_index")
        .eq("course_code", "HELIX02")
        .order("order_index", { ascending: true });

      if (!error && data) {
        setSessions(data.map((s) => ({
          id: s.id, title: s.title, desc: s.desc, videoUrl: s.video_url, audioUrl: s.audio_url,
        })));
      } else { console.error("fetch sessions error:", error); }

      setTimeout(() => setReady(true), 100);
    })();
  }, []);

  useEffect(() => { reloadProgress(); }, [reloadProgress]);

  // بلادرنگ: شنیدن رویداد ذخیرهٔ پیشرفت
  useEffect(() => {
    const onProg = () => reloadProgress();
    window.addEventListener("nilplayer:progress-updated", onProg);
    return () => window.removeEventListener("nilplayer:progress-updated", onProg);
  }, [reloadProgress]);

  useEffect(() => {
    const id = setInterval(() => reloadProgress(), 10000);
    return () => clearInterval(id);
  }, [reloadProgress]);

  return (
    <div className="helix-page">
      <HeaderBar />

      <div className="helix-bg" />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50vh", overflow: "hidden", zIndex: 1, pointerEvents: "none" }}>
        < StarOverlay />
      </div>
      <div className="helix-aurora" />
      <div className="helix-shade" />

      <main className="helix-content" style={{ visibility: ready ? "visible" : "hidden" }}>
        <section className="helix-hero">
          <h1 className="helix-title">{STR("helix02_title")}</h1>
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
                      position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center",
                      gap: 6, padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#fff",
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
