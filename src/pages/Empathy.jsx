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
import { getProgress } from "../utils/progress";

export default function Empathy() {
  const COURSE_CODE = "EMPATHY108";

  const { user } = useAuth();

  const [modal, setModal] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [ready, setReady] = useState(false);

  // فقط برای ریسپانسیو روی موبایل
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const openMedia = async (type, url, title, sessionId) => {
    if (!url) return; // ✅ جلوگیری از باز شدن مودال با لینک خالی

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

    setModal({ type, url, title, sessionId, initialTime, courseCode: COURSE_CODE });
  };

  const reloadProgress = useCallback(async () => {
    if (!user?.username) return;

    const { data, error } = await supabase
      .from("nilplayer_progress")
      .select("session_id, watched_seconds, total_seconds, completed, last_position")
      .eq("username", user.username)
      .eq("course_code", COURSE_CODE);

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
  }, [user?.username]);

  useEffect(() => {
    if (!user?.username) {
      setProgressMap({});
      return;
    }
    reloadProgress();
    const t1 = setTimeout(reloadProgress, 300);
    const t2 = setTimeout(reloadProgress, 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [user?.username, reloadProgress]);

  useEffect(() => {
    const onUserChanged = () => {
      reloadProgress();
      const t1 = setTimeout(reloadProgress, 300);
      const t2 = setTimeout(reloadProgress, 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };
    const onFocus = () => reloadProgress();
    const onVisible = () => {
      if (document.visibilityState === "visible") reloadProgress();
    };

    window.addEventListener("nil:user-changed", onUserChanged);
    window.addEventListener("nil:user-logged-out", () => setProgressMap({}));
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("nil:user-changed", onUserChanged);
      window.removeEventListener("nil:user-logged-out", () => {});
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
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
  }, []);

  useEffect(() => {
    (async () => {
      // بک‌گراند فعلاً همون helix02 می‌مونه
      await Promise.allSettled([preloadImage("/assets/empathy108_bg.png")]);

      const { data, error } = await supabase
        .from("nilplayer_sessions")
        .select("id, title, desc:desc, video_url, audio_url, order_index")
        .eq("course_code", COURSE_CODE)
        .order("order_index", { ascending: true });

      if (!error && data) {
        setSessions(
          (data || []).map((s) => ({
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

      setTimeout(() => setReady(true), 100);
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => reloadProgress(), 10000);
    return () => clearInterval(id);
  }, [reloadProgress]);

  const pageTitle = STR("empathy108_title") || "بر مدار همدلی";
  const pageSubtitle = STR("subtitle") || "";

  return (
    <div key={user?.username || "anon"} className="helix-page">
      <HeaderBar />
      <div
  className="helix-bg"
  style={{ backgroundImage: "url('/assets/empathy108_bg.png')" }}
/>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50vh",
          overflow: "hidden",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <StarOverlay />
      </div>

      <div className="helix-aurora" />
      <div className="helix-shade" />

      <main className="helix-content" style={{ visibility: ready ? "visible" : "hidden" }}>
        <section className="helix-hero" style={{ marginTop: isMobile ? "2vh" : undefined }}>
        <h1
  className="helix-title"
  style={{
    color: "#f43f5e",
    textShadow: "0 0 18px rgba(255,77,109,0.35)",
    fontSize:isMobile?"34px":"48px",
  }}
>
  {STR("empathy108_title")}
</h1>

<p
  className="helix-subtitle"
  style={{
    color: "#f43f5e",
    textShadow: "0 0 12px rgba(255,143,163,0.25)",
    fontSize:isMobile?"18px":"25px",

  }}
>
  {STR("empathy108_subtitle")}
</p>

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
                    title={done ? "کامل دیده شده" : "درصد تماشا (فقط ویدئو)"}
                  >
                    {done ? "✓ کامل" : `${percent}%`}
                  </div>

                  <h3 className="session-title">{s.title}</h3>
                  <p className="session-desc">{s.desc}</p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: s.audioUrl ? "1fr 1fr" : "1fr",
                      gap: 8,
                    }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => openMedia("video", s.videoUrl, s.title, s.id)}
                      disabled={!s.videoUrl}
                      style={{
                        fontSize: isMobile ? "12px" : undefined,
                        padding: isMobile ? "6px 12px" : undefined,
                        opacity: !s.videoUrl ? 0.6 : 1,
                        cursor: !s.videoUrl ? "not-allowed" : "pointer",
                      }}
                    >
                      <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1, marginLeft: 6 }}>
                        🎬
                      </span>
                      {STR("video")}
                    </button>

                    {s.audioUrl && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => openMedia("audio", s.audioUrl, s.title, s.id)}
                        style={{
                          fontSize: isMobile ? "12px" : undefined,
                          padding: isMobile ? "6px 12px" : undefined,
                        }}
                      >
                        <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1, marginLeft: 6 }}>
                          🎧
                        </span>
                        {STR("podcast")}
                      </button>
                    )}
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
