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

  const MOBILE_FORM_TOP = "65%";
  const STAR_COLOR = "#ffffff"; // ستاره‌های سفید

  // بکگراند سریع
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/assets/galaxy_bg11.png";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const fit = () => {
      const w = innerWidth;
      const h = innerHeight;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    fit();
    addEventListener("resize", fit);

    const { innerWidth: W, innerHeight: H } = window;
    const font =
      W < 380
        ? "800 44px system-ui, sans-serif"
        : W < 640
        ? "800 56px system-ui, sans-serif"
        : W < 1024
        ? "900 86px system-ui, sans-serif"
        : "900 118px system-ui, sans-serif";
    const gap = W < 640 ? 3 : 6;
    const em = parseInt(font.match(/(\d+)px/)[1] || "80", 10);
    const lh = 1.1;

    // ساخت نقاط متن
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const c = off.getContext("2d");
    c.fillStyle = "#fff";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = font;
    const lines = ["NIL", "PLAYER"];
    const totalH = em * lh * (lines.length - 1);
    const centerY = H / 2 - totalH / 2;
    lines.forEach((t, i) => c.fillText(t, W / 2, centerY + i * em * lh));

    // ساخت آیکون دقیق (نسخه قبل از تغییرات)
    const R = Math.max(34, Math.min(56, em * 0.87));
    const ring = Math.round(R * 0.38);
    const triW = R * 0.95;
    const triH = R * 0.95;
    const cx = W / 2 + (W < 640 ? 130 : 320);
    const cy = H / 2;

    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(cx, cy, R - ring, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
    const tcx = cx + R * 0.14;
    c.beginPath();
    c.moveTo(tcx - triW * 0.38, cy - triH * 0.58);
    c.lineTo(tcx + triW * 0.58, cy);
    c.lineTo(tcx - triW * 0.38, cy + triH * 0.58);
    c.closePath();
    c.fill();

    const data = c.getImageData(0, 0, W, H).data;
    const points = [];
    for (let y = 0; y < H; y += gap) {
      for (let x = 0; x < W; x += gap) {
        const a = (y * W + x) * 4 + 3;
        if (data[a] > 128) points.push({ x, y });
      }
    }

    // ستاره‌ها
    const stars = Array.from({ length: 1400 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.4,
      tx: 0,
      ty: 0,
    }));

    let tick = 0;
    const loop = () => {
      tick++;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      // بکگراند ستاره‌ها
      for (let i = 0; i < 150; i++) {
        const s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = STAR_COLOR;
        ctx.fill();
      }

      // متن و آیکون
      const len = points.length;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const t = points[i % len];
        s.x += (t.x - s.x) * 0.03;
        s.y += (t.y - s.y) * 0.03;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = STAR_COLOR;
        ctx.fill();
      }

      requestAnimationFrame(loop);
    };
    loop();

    return () => removeEventListener("resize", fit);
  }, []);

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
    const found = allowed.find((u) => (u.username || "").trim().toLowerCase() === id);
    if (!found) return alert("یوزرنیم مجاز نیست.");
    const userObj = {
      id: found.username,
      name: found.username,
      username: found.username,
      course_code: (found.course_code || "").toUpperCase(),
    };
    localStorage.setItem("nil_auth", JSON.stringify(userObj));
    navigate(userObj.course_code === "HELIX02" ? "/helix02" : "/helix01", { replace: true });
  }

  const isSmall = window.innerWidth < 640;
  const formTop = isSmall ? MOBILE_FORM_TOP : "72%";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('/assets/galaxy_bg11.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0a1022",
        direction: "rtl",
        fontFamily: "Vazirmatn, system-ui, sans-serif",
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
            color: "#00297F",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid #00297F",
            textAlign: "right",
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            marginTop: 10,
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
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
