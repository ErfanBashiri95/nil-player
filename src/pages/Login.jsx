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

  // ---------- BACKGROUND ----------
  const FALLBACKS = ["/assets/galaxy_bg11.png", "/assets/galaxy_bg11.webp", "/assets/galaxy_bg11.jpg"];
  const [bgUrl, setBgUrl] = useState("");
  const BASE_GRADIENT =
    "linear-gradient(180deg, rgba(8,14,34,1) 0%, rgba(12,22,50,1) 50%, rgba(9,17,38,1) 100%)";

  useEffect(() => {
    let loaded = false;
    (async () => {
      for (const url of FALLBACKS) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = reject;
          });
          if (!loaded) {
            loaded = true;
            setBgUrl(url);
            break;
          }
        } catch {
          continue;
        }
      }
      if (!loaded) setBgUrl(FALLBACKS[0]);
    })();
  }, []);

  const GATHER_LERP = 0.03;
  const SCATTER_LERP = 0.03;

  useEffect(() => {
    if (!bgUrl) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

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

    function getOffsets() {
      const isSM = window.innerWidth < 640;
      const textOffX = isSM ? -16 : -10;
      const textOffY = isSM ? -18 : 0;
      const iconOffX = isSM
        ? Math.max(80, Math.min(window.innerWidth * 0.32, 160))
        : Math.min(360, window.innerWidth * 0.24 + 120);
      const iconOffY = 0;
      return { textOffX, textOffY, iconOffX, iconOffY };
    }
    let OFF = getOffsets();

    const fontSpec = () => {
      if (innerWidth < 360) return { font: "800 40px system-ui, sans-serif", gap: 3, lh: 1.15 };
      if (innerWidth < 640) return { font: "800 56px system-ui, sans-serif", gap: 3, lh: 1.15 };
      if (innerWidth < 1024) return { font: "900 86px system-ui, sans-serif", gap: 6, lh: 1.12 };
      return { font: "900 118px system-ui, sans-serif", gap: 6, lh: 1.1 };
    };

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
            pts.push({ x: x + offX + OFF.textOffX, y: y + offY + OFF.textOffY });
          }
        }
      }
      return pts;
    }

    function makeIconPoints(font, baseGap = 4) {
      const W = Math.min(innerWidth, 1100);
      const H = Math.min(innerHeight, 520);
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const c = off.getContext("2d");
      c.clearRect(0, 0, W, H);

      const em = parseInt(font.match(/(\d+)px/)[1] || "80", 10);
      const scale = window.innerWidth < 640 ? 0.79 : 1;
      const R = Math.max(34, Math.min(56, em * 0.87 * scale));
      const ring = Math.max(6, Math.round(R * 0.38));
      const triW = R * 0.95;
      const triH = R * 0.95;
      const cx = W / 2 + OFF.iconOffX;
      const cy = H / 2 + OFF.iconOffY;

      c.fillStyle = "#fff";
      c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = "destination-out";
      c.beginPath(); c.arc(cx, cy, R - ring, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = "source-over";
      const tcx = cx + R * 0.14, tcy = cy;
      c.beginPath();
      c.moveTo(tcx - triW * 0.38, tcy - triH * 0.58);
      c.lineTo(tcx + triW * 0.58, tcy);
      c.lineTo(tcx - triW * 0.38, tcy + triH * 0.58);
      c.closePath(); c.fill();

      const gap = window.innerWidth < 640 ? Math.max(3, baseGap - 2) : Math.max(3, baseGap - 3);
      const { data } = c.getImageData(0, 0, W, H);
      const pts = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          const a = (y * W + x) * 4 + 3;
          if (data[a] > 128) {
            const offX = (canvas.width / DPR - W) / 2;
            const offY = (canvas.height / DPR - H) / 2;
            pts.push({ x: x + offX + OFF.textOffX, y: y + offY + OFF.textOffY });
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

    const STAR_COLOR = "#FFFFFF";
    const BG_COUNT = innerWidth < 600 ? 140 : 320;
    const TEXT_COUNT = innerWidth < 600 ? 1100 : 2000;

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
      fit();
      OFF = getOffsets();
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
  }, [bgUrl]);

  // ✅ اصلاح شده:
  async function handleLogin() {
    const id = username.trim().toLowerCase();
    if (!id) return;
    const found = allowed.find(u => u.username.trim().toLowerCase() === id);
    if (!found) return alert("یوزرنیم مجاز نیست.");

    try {
      const user = await login(found.username);
      const code = (user?.course_code || found.course_code || "").toUpperCase();

navigate(
  code === "HELIX02"
    ? "/helix02"
    : code === "EMPATHY108"
    ? "/empathy108"
    : "/helix01",
  { replace: true }
);

    } catch (err) {
      console.error(err);
      alert("خطا در ورود");
    }
  }

  const isSmall = window.innerWidth < 640;
  const formTop = isSmall ? "65%" : "72%";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: bgUrl
          ? `url('${bgUrl}') center/cover no-repeat, ${BASE_GRADIENT}`
          : BASE_GRADIENT,
        zIndex: 0,
        direction: "rtl",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

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
            color: "#fff",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid #00297F",
            textAlign: "right",
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            borderRadius: 10,
            padding: "8px 18px",
            fontSize: "15px",
            background: "linear-gradient(90deg, #1A83CC 0%, #2CA7E3 100%)",
            color: "#fff",
            fontWeight: 700,
            border: "none",
          }}
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
          width: isSmall ? 110 : 180,
          opacity: 0.9,
        }}
      />
    </div>
  );
}
