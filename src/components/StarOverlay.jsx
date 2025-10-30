import { useEffect, useRef } from "react";

/**
 * StarOverlay: لایه‌ی ستاره‌های سبکِ روی بکگراند
 * - شفاف، با مصرف کم (FPS محدود، تعداد ستاره متناسب با عرض)
 * - بدون دخالت در کلیک‌ها (pointerEvents:none)
 */
export default function StarOverlay() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const fit = () => {
      const w = window.innerWidth, h = window.innerHeight;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    fit();

    // ستاره‌ها: تعداد تابعی از عرض صفحه
    const COUNT = window.innerWidth < 480 ? 60 : window.innerWidth < 1024 ? 110 : 150;
    const stars = Array.from({ length: COUNT }, () => ({
      x: Math.random() * (canvas.width / DPR),
      y: Math.random() * (canvas.height / DPR),
      r: Math.random() * 1.1 + 0.4,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      tw: Math.random() * 2 * Math.PI,
      tws: 0.015 + Math.random() * 0.02, // سرعت چشمک‌زدن
    }));

    let last = 0;
    const render = (t = 0) => {
      // محدود کردن FPS ~30 برای مصرف کمتر
      if (t - last < 33) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      last = t;

      const W = canvas.width / DPR, H = canvas.height / DPR;
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.tw += s.tws;

        // پیچاندن لبه‌ها (wrap)
        if (s.x < -10) s.x = W + 10;
        if (s.x > W + 10) s.x = -10;
        if (s.y < -10) s.y = H + 10;
        if (s.y > H + 10) s.y = -10;

        // چشمک‌زدن نرم با آبی کمرنگ
        const alpha = 0.65 + Math.sin(s.tw) * 0.25;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "#9fd6ff";
        ctx.shadowColor = "rgba(159,214,255,0.8)";
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    const onResize = () => fit();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1, // بالاتر از بکگراند، پایین‌تر از محتوا
        background: "transparent",
      }}
    />
  );
}
