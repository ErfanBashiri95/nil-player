import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { validateSecureURL } from "../utils/tokenUtils";

export default function MediaModal({ open, onClose, type, url, title, sessionId, initialTime, courseCode }) {
  const { user } = useAuth();
  const [playbackRate, setPlaybackRate] = useState(1);
  const [wmVisible, setWmVisible] = useState(false);
  const [wmPos, setWmPos] = useState({ top: "20%", left: "30%" });
  const [warning, setWarning] = useState(false);
  const [expired, setExpired] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // اعتبار لینک
  useEffect(() => {
    if (!open || !url) return;
    setExpired(!validateSecureURL(url));
  }, [url, open]);

  // واترمارک پویا
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const top = Math.floor(Math.random() * 70) + 10;
      const left = Math.floor(Math.random() * 70) + 10;
      setWmPos({ top: `${top}%`, left: `${left}%` });
      setWmVisible(true);
      setTimeout(() => setWmVisible(false), 3000);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [open]);

  // ضد ضبط صفحه
  useEffect(() => {
    if (!open) return;
    const id = setInterval(async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const isCapturing = devices.some(d => d.kind === "videoinput" && d.label.includes("Screen"));
        setWarning(isCapturing);
        if (isCapturing && videoRef.current) videoRef.current.pause();
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [open]);

  // بستن با ESC
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // شروع از ادامه
  useEffect(() => {
    if (!open) return;
    const el = type === "video" ? videoRef.current : audioRef.current;
    if (el && typeof initialTime === "number" && initialTime > 0) {
      const once = () => { el.currentTime = initialTime; el.removeEventListener("loadedmetadata", once); };
      el.addEventListener("loadedmetadata", once);
    }
  }, [open, type, initialTime]);

  const applyRate = (r) => {
    setPlaybackRate(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
    if (audioRef.current) audioRef.current.playbackRate = r;
  };

  if (!open) return null;

  if (expired) {
    return (
      <div onClick={onClose} style={S.overlay}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>⏱ لینک منقضی شده است</h3>
          <p style={{ opacity: 0.75, marginTop: 8 }}>لطفاً صفحه را رفرش کنید و دوباره تلاش نمایید.</p>
          <button onClick={onClose} style={S.primaryBtn}>بستن</button>
        </div>
      </div>
    );
  }

  const SpeedPills = ({ value, onChange }) => {
    const presets = [0.75, 1, 1.25, 1.5, 2];
    return (
      <div style={S.pillsRow}>
        <span style={S.pillsLabel}>سرعت پخش:</span>
        <div style={S.pillsWrap}>
          {presets.map((r) => (
            <button
              key={r}
              onClick={() => onChange(r)}
              style={{
                ...S.pill,
                ...(value === r ? S.pillActive : null),
              }}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="media-modal-overlay" onClick={(e) => e.target.classList.contains("media-modal-overlay") && onClose()} style={S.overlay}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        {/* هدر */}
        <div style={S.header}>
          <div style={S.headLeft}>
            <div style={S.mediaBadge}>{type === "video" ? "🎬 ویدئو" : "🎧 پادکست"}</div>
            <h3 style={S.title} title={title}>{title}</h3>
          </div>
          <button onClick={onClose} aria-label="بستن" style={S.closeBtn}>×</button>
        </div>

        {/* بدنه */}
        {type === "video" ? (
          <div style={{ position: "relative" }}>
            <video
              ref={videoRef}
              src={url}
              controls
              playsInline
              autoPlay
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              style={S.video}
            />

            {/* واترمارک */}
            {user?.username && (
              <div style={{
                position: "absolute",
                ...wmPos,
                opacity: wmVisible ? 0.4 : 0,
                transform: wmVisible ? "scale(1)" : "scale(0.96)",
                transition: "opacity .6s ease, transform .6s ease, top .6s, left .6s",
                color: "#fff",
                fontWeight: 700,
                fontSize: "clamp(12px, 1.8vw, 16px)",
                pointerEvents: "none",
                userSelect: "none",
                textShadow: "0 0 10px rgba(0,0,0,0.7)",
              }}>
                {`${user.username} • ${new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
              </div>
            )}

            {/* هشدار ضبط صفحه */}
            {warning && (
              <div style={S.warn}>
                ⚠️ ضبط صفحه شناسایی شد!
                <br />لطفاً ضبط را متوقف کنید.
              </div>
            )}

            {/* سرعت پخش */}
            <div style={S.fabRate}>
              <select
                value={playbackRate}
                onChange={(e) => applyRate(Number(e.target.value))}
                style={S.fabSelect}
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => <option key={s} value={s}>{s}x</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div style={S.audioBox}>
            <audio
              ref={audioRef}
              src={url}
              controls
              autoPlay
              controlsList="nodownload noremoteplayback"
              onContextMenu={(e) => e.preventDefault()}
              style={S.audio}
            />
            <SpeedPills value={playbackRate} onChange={applyRate} />
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn {from{opacity:0} to{opacity:1}}`}</style>
    </div>
  );
}

/* ---------- styles ---------- */
const S = {
  overlay: {
    position: "fixed", inset: 0,
    background: "radial-gradient(120% 120% at 50% 20%, rgba(10,14,30,.85), rgba(4,6,14,.75))",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    zIndex: 999,
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: "fadeIn .25s ease",
  },
  card: {
    width: "min(680px, 92vw)",
    ...(typeof window !== "undefined" && window.innerWidth < 520 ? { width: "min(520px, 94vw)" } : {}),
    background: "linear-gradient(180deg, rgba(20,25,45,.78), rgba(16,20,38,.92))",
    borderRadius: 20,
    padding: 16,
    position: "relative",
    color: "#fff",
    boxShadow: "0 10px 35px rgba(0,0,0,.5)",
    border: "1px solid rgba(255,255,255,.12)",
    direction: "rtl",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  headLeft: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  mediaBadge: {
    padding: "6px 10px",
    background: "linear-gradient(90deg,#1A83CC,#2CA7E3)",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    boxShadow: "0 6px 16px rgba(26,131,204,.35)",
    whiteSpace: "nowrap",
  },
  title: {
    margin: 0, fontSize: 16, fontWeight: 800, overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap",
    opacity: .95,
  },
  closeBtn: {
    width: 36, height: 36,
    display: "grid", placeItems: "center",
    borderRadius: 999, border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(255,255,255,.06)",
    color: "#fff", fontSize: 20, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,.35)",
  },
  video: {
    width: "100%", borderRadius: 14, background: "#000",
    outline: "1px solid rgba(255,255,255,.06)",
  },
  warn: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,.75)", color: "#ff5a5a",
    fontWeight: 800, fontSize: "clamp(14px, 2vw, 18px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    textAlign: "center", zIndex: 10, backdropFilter: "blur(8px)",
  },
  fabRate: {
    position: "absolute", top: 10, right: 10,
    background: "rgba(0,0,0,.45)",
    border: "1px solid rgba(255,255,255,.22)",
    borderRadius: 12, padding: "2px 6px",
    boxShadow: "0 6px 14px rgba(0,0,0,.35)",
  },
  fabSelect: {
    background: "transparent", color: "#0B1A3A",
    border: "none", fontSize: 13, outline: "none", cursor: "pointer",
  },
  audioBox: {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 14,
    padding: 12,
  },
  audio: {
    width: "100%", accentColor: "#1A83CC",
    filter: "saturate(1.05)",
  },
  pillsRow: {
    display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap",
  },
  pillsLabel: { fontSize: 13, opacity: .9, whiteSpace: "nowrap" },
  pillsWrap: { display: "flex", gap: 6, flexWrap: "wrap" },
  pill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.18)",
    color: "#fff",
    fontSize: 12.5, fontWeight: 800,
    cursor: "pointer",
  },
  pillActive: {
    background: "linear-gradient(90deg,#1A83CC,#2CA7E3)",
    borderColor: "rgba(255,255,255,.35)",
    boxShadow: "0 6px 16px rgba(26,131,204,.35)",
  },
  primaryBtn: {
    marginTop: 16, padding: "8px 14px",
    background: "#1A83CC", color: "#fff",
    borderRadius: 10, border: "none", cursor: "pointer",
  },
};
