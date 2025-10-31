import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import allowed from "../data/allowedUsers.json";
import "../styles/starfield.css";

export default function Login() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const timersRef = useRef({});
  const [username, setUsername] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth() || {};

  // --- پارامترهای موبایل ---
  const MOBILE_TEXT_OFFSET_X = -30;
  const MOBILE_TEXT_OFFSET_Y = -20;
  const MOBILE_ICON_OFFSET_X = 130; // مقدار دلخواه تو (پیکسل) — ولی در عمل کلمپ می‌شود
  const MOBILE_ICON_OFFSET_Y = 0;
  const MOBILE_GAP = 3;
  const MOBILE_ICON_SCALE = 0.79;
  const MOBILE_FORM_TOP = "65%";

  // سرعت‌ها
  const GATHER_LERP = 0.03;
  const SCATTER_LERP = 0.03;

  // ✅ preload بکگراند، بدون بلاک‌کردن UI
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/assets/galaxy_bg11.png";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    let isSM = window.innerWidth < 640;

    const fit = () => {
      const w = innerWidth, h = innerHeight;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    fit();

    let mode = "scatter";
    let wobble = false;

    const fontSpec = () => {
      if (innerWidth < 380) return { font: "800 44px system-ui, sans-serif", gap: MOBILE_GAP, lh: 1.15 };
      if (innerWidth < 640) return { font: "800 56px system-ui, sans-serif", gap: MOBILE_GAP, lh: 1.15 };
      if (innerWidth < 1024) return { font: "900 86px system-ui, sans-serif", gap: 7, lh: 1.12 };
      return { font: "900 118px system-ui, sans-serif", gap: 8, lh: 1.1 };
    };

    const TEXT_OFFSET_X = isSM ? MOBILE_TEXT_OFFSET_X : -10;
    const TEXT_OFFSET_Y = isSM ? MOBILE_TEXT_OFFSET_Y : 0;
    const ICON_OFFSET_X = isSM ? MOBILE_ICON_OFFSET_X : 320; // ورودی پایه، اما بعداً کلمپ می‌شود
    const ICON_OFFSET_Y = isSM ? MOBILE_ICON_OFFSET_Y : 0;

    let targets = [];

    function makeMultilinePoints(lines, font, gap = 3, lineHeight = 1.1) {
      const off = document.createElement("canvas");
      const W = Math.min(innerWidth, 1100);
      const H = Math.min(innerHeight, 520);
      off.width = W; off.height = H;
      const c = off.getContext("2d");
      c.clearRect(0, 0, W, H);
      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = font;

      const em = parseInt(font.match(/(\d+)px/)[1] || "80", 10);
      const totalH = em * lineHeight * (lines.length - 1);
      const centerY = H / 2 - totalH / 2;
      lines.forEach((t, i) => c.fillText(t, W / 2, centerY + i * em * lineHeight));

      const { data } = c.getImageData(0, 0, W, H);
      const pts = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          const a = (y * W + x) * 4 + 3;
          if (data[a] > 128) {
            const offX = (canvas.width / DPR - W) / 2;
            const offY = (canvas.height / DPR - H) / 2;
            pts.push({ x: x + offX + TEXT_OFFSET_X, y: y + offY + TEXT_OFFSET_Y });
          }
        }
      }
      return pts;
    }

    // 🔧 آیکون با «کلمپ هوشمند» تا همیشه کامل دیده شود
    function makeIconPoints(font, baseGap = 4) {
      const W = Math.min(innerWidth, 1100);
      const H = Math.min(innerHeight, 520);
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const c = off.getContext("2d");
      c.clearRect(0, 0, W, H);

      const em = parseInt(font.match(/(\d+)px/)[1] || "80", 10);
      const scale = isSM ? MOBILE_ICON_SCALE : 1;

      // اندازه آیکون نسبت به فونت/ویوپورت
      const R = Math.max(34, Math.min(56, em * 0.87 * scale));
      const ring = Math.max(6, Math.round(R * 0.38));
      const triW = R * 0.95;
      const triH = R * 0.95;

      // افست مطلوب → به درصد تبدیل می‌کنیم و سپس کلمپ
      const desiredOffsetX = isSM ? Math.max(0.22 * W, MOBILE_ICON_OFFSET_X) : Math.max(0.28 * W, ICON_OFFSET_X);
      const desiredOffsetY = ICON_OFFSET_Y;

      // حاشیهٔ امن تا دایره کامل جا شود
      const pad = R + 10;

      // clamp(x, a, b)
      const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

      const cx = clamp(W / 2 + desiredOffsetX, pad, W - pad);
      const cy = clamp(H / 2 + desiredOffsetY, pad, H - pad);

      // دایره
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(cx, cy, R, 0, Math.PI * 2);
      c.fill();

      // سوراخ حلقه
      c.globalCompositeOperation = "destination-out";
      c.beginPath();
      c.arc(cx, cy, R - ring, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = "source-over";

      // مثلث Play
      const tcx = cx + R * 0.14;
      const tcy = cy;
      c.beginPath();
      c.moveTo(tcx - triW * 0.38, tcy - triH * 0.58);
      c.lineTo(tcx + triW * 0.58, tcy);
      c.lineTo(tcx - triW * 0.38, tcy + triH * 0.58);
      c.closePath();
      c.fill();

      const gap = isSM ? Math.max(3, baseGap - 3) : Math.max(4, baseGap - 2);
      const { data } = c.getImageData(0, 0, W, H);
      const pts = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          const a = (y * W + x) * 4 + 3;
          if (data[a] > 128) {
            const offX = (canvas.width / DPR - W) / 2;
            const offY = (canvas.height / DPR - H) / 2;
            // توجه: TEXT_OFFSET_X/Y همچنان اعمال می‌شود تا با متن هم‌راستا بماند
            pts.push({ x: x + offX + TEXT_OFFSET_X, y: y + offY + TEXT_OFFSET_Y });
          }
        }
      }
      return pts;
    }

    function rebuildTargets() {
      const { font, gap, lh } = fontSpec();
      const textPts = makeMultilinePoints(["NIL", "PLAYER"], font, gap, lh);
      const iconPts = makeIconPoints(font, gap);
      targets = [...textPts, ...iconPts];
    }

    // ⭐ ستاره‌های سفید
    const STAR_COLOR = "#ffffff";

    const BG_COUNT = innerWidth < 600 ? 80 : 150;
    const TEXT_COUNT = innerWidth < 600 ? 900 : 1700;

    const bgStars = Array.from({ length: BG_COUNT }, () => ({
      x: Math.random() * canvas.width / DPR,
      y: Math.random() * canvas.height / DPR,
      r: Math.random() * 1.2 + 0.4,
    }));
    const textStars = Array.from({ length: TEXT_COUNT }, () => ({
      hx: Math.random() * canvas.width / DPR,
      hy: Math.random() * canvas.height / DPR,
      x: 0, y: 0,
      r: Math.random() * 1.3 + 0.45,
      tx: null, ty: null,
    }));

    function resetHomes() {
      for (const s of textStars) {
        s.hx = Math.random() * canvas.width / DPR;
        s.hy = Math.random() * canvas.height / DPR;
        if (mode === "scatter") { s.x = s.hx; s.y = s.hy; }
      }
    }

    rebuildTargets();
    resetHomes();

    const onResize = () => {
      isSM = window.innerWidth < 640;
      fit();
      rebuildTargets();
      resetHomes();
    };
    addEventListener("resize", onResize);

    function startCycle() {
      mode = "scatter";
      timersRef.current.g = setTimeout(() => { mode = "gather"; }, 2000);
      timersRef.current.s = setTimeout(() => { mode = "scatter"; }, 12000);
    }
    startCycle();
    timersRef.current.loop = setInterval(startCycle, 12000);
    timersRef.current.wob = setInterval(() => { wobble = !wobble; }, 2000);

    let tick = 0;
    const loop = () => {
      tick++;
      const W = canvas.width / DPR, H = canvas.height / DPR;
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        s.x += (Math.random() - 0.5) * 0.25;
        s.y += (Math.random() - 0.5) * 0.25;
        ctx.globalAlpha = 0.8 + Math.sin((i + tick) * 0.03) * 0.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = STAR_COLOR;
        ctx.fill();
      }

      ctx.globalAlpha = 0.96;
      const tLen = targets.length || 1;
      for (let i = 0; i < textStars.length; i++) {
        const s = textStars[i];
        if (mode === "gather" && tLen) {
          const t = targets[i % tLen];
          const baseTx = t.x, baseTy = t.y;
          if (wobble) {
            const ph = (i % 7) * 0.7 + tick * 0.06;
            s.tx = baseTx + Math.sin(ph) * 1.2;
            s.ty = baseTy + Math.cos(ph) * 1.2;
          } else {
            s.tx = baseTx; s.ty = baseTy;
          }
          s.x += (s.tx - s.x) * GATHER_LERP;
          s.y += (s.ty - s.y) * GATHER_LERP;
        } else {
          s.x += (s.hx - s.x) * SCATTER_LERP;
          s.y += (s.hy - s.y) * SCATTER_LERP;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = STAR_COLOR;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      removeEventListener("resize", onResize);
      Object.values(timersRef.current).forEach(h => (clearInterval(h), clearTimeout(h)));
      document.body.style.overflow = prev;
    };
  }, []);

  // ---- Login Handler ----
  async function handleLogin() {
    const id = (username || "").trim().toLowerCase();
    if (!id) return;

    try {
      if (typeof login === "function") {
        const u = await login(id);
        const code = (u?.course_code || "").toUpperCase();
        navigate(code === "HELIX02" ? "/helix02" : "/helix01", { replace: true });
        return;
      }
    } catch {}

    const found = allowed.find(
      (u) => (u.username || "").trim().toLowerCase() === id
    );
    if (!found) {
      alert("یوزرنیم مجاز نیست.");
      return;
    }
    const userObj = {
      id: found.username,
      name: found.username,
      username: found.username,
      course_code: (found.course_code || "").toUpperCase(),
    };
    try { localStorage.setItem("nil_auth", JSON.stringify(userObj)); } catch {}
    navigate(userObj.course_code === "HELIX02" ? "/helix02" : "/helix01", { replace: true });
  }

  const isSmall = typeof window !== "undefined" ? window.innerWidth < 640 : false;
  const formTop = isSmall ? MOBILE_FORM_TOP : "72%";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundImage: "url('/assets/galaxy_bg11.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0a1022",
        zIndex: 0,
        direction: "rtl",
        fontFamily: "Vazirmatn, Vazir, system-ui, sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "transparent",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* فرم ورود */}
      <div
        style={{
          position: "absolute",
          top: formTop,
          left: "50%",
          transform: "translate(-50%, 0)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
          width: "min(85vw, 280px)",
          zIndex: 40,
        }}
      >
        <input
          placeholder="لطفا نام کاربری خود را وارد کنید"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={{
            width: "90%",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: "14px",
            color: "#00297F",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid #00297F",
            outline: "none",
            textAlign: "right",
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            alignSelf: "center",
            borderRadius: 10,
            padding: "8px 18px",
            fontSize: "15px",
            background: "linear-gradient(90deg, #1A83CC 0%, #2CA7E3 100%)",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 10px rgba(26,131,204,0.55)",
            transition: "box-shadow .25s ease",
            width: "auto",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 16px rgba(26,131,204,0.85)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 10px rgba(26,131,204,0.55)")}
        >
          ورود
        </button>
      </div>

      <img
        src="/assets/nil_logo_vertical.png"
        alt="Nil Logo"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: window.innerWidth < 640 ? 110 : 180,
          opacity: 0.9,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 50,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}
