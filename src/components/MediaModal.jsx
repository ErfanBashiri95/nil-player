import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useAuth } from "../context/AuthContext";
import { validateSecureURL } from "../utils/tokenUtils";
import { saveProgress, getProgress } from "../utils/progress";

/** کلید رزوم محلی برای پادکست (جدا از ویدئو و جدا از DB) */
const audioKey = (username, sessionId) =>
  `nilplayer.audio.resume::${username || "anon"}::${sessionId}`;

const readAudioResume = (username, sessionId) => {
  try {
    const v = localStorage.getItem(audioKey(username, sessionId));
    return Math.max(0, Number(v || 0));
  } catch {
    return 0;
  }
};
const writeAudioResume = (username, sessionId, seconds) => {
  try {
    localStorage.setItem(audioKey(username, sessionId), String(Math.max(0, Math.floor(seconds || 0))));
  } catch {}
};

export default function MediaModal({
  open, onClose, type, url, title, sessionId, initialTime, courseCode
}) {
  const { user } = useAuth();
  const username = user?.username;

  // ===== UI state =====
  const [playbackRate, setPlaybackRate] = useState(1);
  const [wmVisible, setWmVisible] = useState(false);
  const [wmPos, setWmPos] = useState({ top: "20%", left: "30%" });
  const [warning, setWarning] = useState(false);
  const [expired, setExpired] = useState(false);

  // ===== refs =====
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const hlsRef = useRef(null);

  // ===== progress state (فقط برای ویدئو مهم است) =====
  const [duration, setDuration] = useState(0);
  const [maxSeen, setMaxSeen] = useState(0);
  const lastSentRef = useRef(0);
  const shouldSend = (now) =>
    now - lastSentRef.current > 5000 ? ((lastSentRef.current = now), true) : false;

  // ===== start position =====
  // ویدئو: از DB (یا initialTime)
  // پادکست: فقط از localStorage
  const [startAt, setStartAt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open) return;
      if (type === "audio") {
        const local = readAudioResume(username, sessionId);
        if (!cancelled) setStartAt(local || 0);
      } else {
        const base = Number(initialTime || 0);
        if (base > 0) { setStartAt(base); return; }
        if (!username || !sessionId) return;
        const { data } = await getProgress(username, sessionId);
        if (!cancelled) setStartAt(Number(data?.last_position || 0));
      }
    })();
    return () => { cancelled = true; };
  }, [open, type, initialTime, username, sessionId]);

  // ===== link validity =====
  useEffect(() => {
    if (!open || !url) return;
    setExpired(!validateSecureURL(url));
  }, [url, open]);

  // ===== watermark (به‌همراه تاریخ و ساعت) =====
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

  // ===== anti screen-record (فقط ویدئو را pause کن) =====
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

  // ===== ESC to close =====
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // ===== helper: اطلاع به صفحه برای رفرش پرگرِس بدون رفرش کل صفحه =====
  const notifyProgress = () => {
    try {
      window.dispatchEvent(new CustomEvent("nilplayer:progress-updated", {
        detail: { sessionId, courseCode, username, ts: Date.now() }
      }));
    } catch {}
  };

  // ================= VIDEO (HLS + DB progress) =================
  useEffect(() => {
    if (!open || type !== "video") return;
    const video = videoRef.current;
    if (!video) return;
  
    const isHls = typeof url === "string" && url.includes(".m3u8");
  
    // --- helpers ---
    const jumpToStart = () => {
      if (startAt && video.readyState >= 1) {
        try { video.currentTime = startAt; } catch {}
      } else {
        const once = () => { try { video.currentTime = startAt || 0; } catch {} video.removeEventListener("loadedmetadata", once); };
        video.addEventListener("loadedmetadata", once);
      }
    };
  
    const saveSnap = () => {
      const t = video.currentTime || 0;
      const d = video.duration || duration || 0;
      saveProgress({
        username: user?.username, courseCode, sessionId,
        lastPosition: t,
        watchedSeconds: Math.max(maxSeen, t),
        totalSeconds: d,
        completed: false,
      });
    };
  
    const onLoadedMeta = () => {
      const d = video.duration || 0;
      setDuration(d);
      jumpToStart();
      // اولین اسنپ برای ساخت رکورد
      saveProgress({
        username: user?.username, courseCode, sessionId,
        lastPosition: startAt || 0,
        watchedSeconds: startAt || 0,
        totalSeconds: d,
        completed: false,
      });
      video.play().catch(() => {});
    };
  
    const onTime = () => {
      const t = video.currentTime || 0;
      const d = video.duration || duration || 0;
      setMaxSeen((prev) => Math.max(prev, t));
      if (shouldSend(performance.now())) {
        saveProgress({
          username: user?.username, courseCode, sessionId,
          lastPosition: t,
          watchedSeconds: Math.max(maxSeen, t),
          totalSeconds: d,
          completed: false,
        });
      }
    };
  
    const onPause = () => saveSnap();
  
    const onEnded = () => {
      const d = video.duration || duration || 0;
      saveProgress({
        username: user?.username, courseCode, sessionId,
        lastPosition: d,
        watchedSeconds: d,
        totalSeconds: d,
        completed: true,
      });
    };
  
    const onBeforeUnload = () => saveSnap();
  
    // --- attach listeners ---
    video.addEventListener("loadedmetadata", onLoadedMeta);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    window.addEventListener("beforeunload", onBeforeUnload);
  
    // قبل از هر لود، سورس قبلی را کاملاً پاک کن
    try { video.pause(); } catch {}
    try { video.removeAttribute("src"); } catch {}
    try { video.load(); } catch {}
  
    // --- HLS load with robust error handling ---
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          // تنظیمات محافظه‌کارانه برای دستگاه‌های قدیمی
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
        });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.loadSource(url);
  
        // اگر مانیفست پارس شد و متادیتا آماده بود
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (video.readyState >= 1) onLoadedMeta();
        });
  
        // هندل و ریکاوری خطاها
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (!data?.fatal) return;
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // تلاش مجدد شبکه
              try { hls.startLoad(); } catch {}
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // ریکاوری مدیا
              try { hls.recoverMediaError(); } catch {}
              break;
            default:
              // ریلود کامل منبع به‌صورت امن
              try {
                hls.destroy();
              } catch {}
              hlsRef.current = null;
              const nhls = new Hls({ enableWorker: true, lowLatencyMode: true });
              hlsRef.current = nhls;
              nhls.attachMedia(video);
              nhls.loadSource(url);
              break;
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari (native HLS)
        video.src = url;
      } else {
        console.warn("HLS not supported on this device.");
        // fallback: چیزی ست نکنیم تا کرش نشه
      }
    } else {
      // فایل MP4 معمولی
      video.src = url;
    }
  
    return () => {
      try { video.pause(); } catch {}
      video.removeEventListener("loadedmetadata", onLoadedMeta);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      try { video.removeAttribute("src"); } catch {}
      try { video.load(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, url, sessionId, courseCode, startAt, user?.username]);
  

  // ================= AUDIO (HLS + LOCAL resume ONLY) =================
  useEffect(() => {
    if (!open || type !== "audio") return;
    const el = audioRef.current;
    if (!el) return;

    const isHls = typeof url === "string" && url.includes(".m3u8");
    const didSeekRef = { current: false };

    const cleanup = () => {
      if (hlsRef.current) { try { hlsRef.current.destroy(); } catch {} hlsRef.current = null; }
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };

    const safeSeek = () => {
      if (didSeekRef.current) return;
      const pos = Math.max(0, Number(startAt || 0));
      if (pos > 0 && el.readyState >= 1) {
        try { el.currentTime = pos; didSeekRef.current = true; } catch {}
      }
    };

    const onLoaded = () => { safeSeek(); };
    const onCanPlay = () => { safeSeek(); };

    // فقط ذخیرهٔ محل پخش در LocalStorage
    const onTime = () => writeAudioResume(username, sessionId, el.currentTime || 0);
    const onPause = () => writeAudioResume(username, sessionId, el.currentTime || 0);
    const onEnded = () => writeAudioResume(username, sessionId, 0);

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.attachMedia(el);
        hls.loadSource(url);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { safeSeek(); });
      } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
        el.src = url;
      } else {
        console.warn("HLS not supported for audio.");
        el.src = "";
      }
    } else {
      el.src = url; // MP3/AAC مستقیم
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, url, sessionId, startAt, username]);

  // ===== playback rate =====
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
              style={{ ...S.pill, ...(value === r ? S.pillActive : null) }}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    );
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("fa-IR"); // تاریخ
  const timeStr = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); // ساعت

  return (
    <div
      className="media-modal-overlay"
      onClick={(e) => e.target.classList.contains("media-modal-overlay") && onClose()}
      style={S.overlay}
    >
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div style={S.header}>
          <div style={S.headLeft}>
            <div style={S.mediaBadge}>{type === "video" ? "🎬 ویدئو" : "🎧 پادکست"}</div>
            <h3 style={S.title} title={title}>{title}</h3>
          </div>
          <button onClick={onClose} aria-label="بستن" style={S.closeBtn}>×</button>
        </div>

        {/* body */}
        {type === "video" ? (
          <div style={{ position: "relative" }}>
            <video
              ref={videoRef}
              controls
              playsInline
              autoPlay
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              style={S.video}
            />

            {/* watermark */}
            {username && (
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
                textShadow: "0 0 10px rgba(0,0,0,.7)",
              }}>
                {`${username} • ${dateStr} ${timeStr}`}
              </div>
            )}

            {/* warn */}
            {warning && (
              <div style={S.warn}>⚠️ ضبط صفحه شناسایی شد!<br />لطفاً ضبط را متوقف کنید.</div>
            )}

            {/* speed */}
            <div style={S.fabRate}>
              <select
                value={playbackRate}
                onChange={(e) => applyRate(Number(e.target.value))}
                style={S.fabSelect}
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={S.audioBox}>
            <audio
              ref={audioRef}
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
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center",
    animation: "fadeIn .25s ease",
  },
  card: {
    width: "min(680px, 92vw)",
    ...(typeof window !== "undefined" && window.innerWidth < 520 ? { width: "min(520px, 94vw)" } : {}),
    background: "linear-gradient(180deg, rgba(20,25,45,.78), rgba(16,20,38,.92))",
    borderRadius: 20, padding: 16, position: "relative", color: "#fff",
    boxShadow: "0 10px 35px rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.12)",
    direction: "rtl",
  },
  header: {
    display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
    gap: 10, marginBottom: 10,
  },
  headLeft: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  mediaBadge: {
    padding: "6px 10px",
    background: "linear-gradient(90deg,#1A83CC,#2CA7E3)",
    borderRadius: 999, fontSize: 12, fontWeight: 800,
    boxShadow: "0 6px 16px rgba(26,131,204,.35)", whiteSpace: "nowrap",
  },
  title: {
    margin: 0, fontSize: 16, fontWeight: 800,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: .95,
  },
  closeBtn: {
    width: 36, height: 36, display: "grid", placeItems: "center",
    borderRadius: 999, border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 20,
    cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,.35)",
  },
  video: { width: "100%", borderRadius: 14, background: "#000", outline: "1px solid rgba(255,255,255,.06)" },
  warn: {
    position: "absolute", inset: 0, background: "rgba(0,0,0,.75)", color: "#ff5a5a",
    fontWeight: 800, fontSize: "clamp(14px, 2vw, 18px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    textAlign: "center", zIndex: 10, backdropFilter: "blur(8px)",
  },
  fabRate: {
    position: "absolute", top: 10, right: 10,
    background: "rgba(0,0,0,.45)", border: "1px solid rgba(255,255,255,.22)",
    borderRadius: 12, padding: "2px 6px", boxShadow: "0 6px 14px rgba(0,0,0,.35)",
  },
  fabSelect: {
    background: "transparent", color: "#0B1A3A",
    border: "none", fontSize: 13, outline: "none", cursor: "pointer",
  },
  audioBox: {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 14, padding: 12,
  },
  audio: { width: "100%", accentColor: "#1A83CC", filter: "saturate(1.05)" },
  pillsRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" },
  pillsLabel: { fontSize: 13, opacity: .9, whiteSpace: "nowrap" },
  pillsWrap: { display: "flex", gap: 6, flexWrap: "wrap" },
  pill: {
    padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.18)", color: "#fff",
    fontSize: 12.5, fontWeight: 800, cursor: "pointer",
  },
  pillActive: {
    background: "linear-gradient(90deg,#1A83CC,#2CA7E3)",
    borderColor: "rgba(255,255,255,.35)", boxShadow: "0 6px 16px rgba(26,131,204,.35)",
  },
  primaryBtn: {
    marginTop: 16, padding: "8px 14px",
    background: "#1A83CC", color: "#fff",
    borderRadius: 10, border: "none", cursor: "pointer",
  },
};
