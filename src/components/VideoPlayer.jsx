import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function VideoPlayer({ url, title }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    // پاکسازی نمونه قبلی hls
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = typeof url === "string" && url.toLowerCase().endsWith(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (evt, data) => {
        console.log("HLS error:", data);
      });
    } else {
      // برای mp4 یا زمانی که HLS پشتیبانی نشود
      if (video) video.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  return (
    <div style={{ maxWidth: 960, margin: "20px auto" }}>
      <h2>{title}</h2>
      <video
  ref={videoRef}
  src={url}
  controls
  playsInline
  preload="metadata" // اول متادیتا لود شود
  /* autoPlay را برمی‌داریم که مرورگر بلاک نکند
     اگر خواستی خودکار پخش شود: autoPlay muted */
  controlsList="nodownload noremoteplayback"
  disablePictureInPicture
  onContextMenu={(e) => e.preventDefault()}
  onLoadedMetadata={(e) => {
    // بعد از لود متادیتا، سرعت اعمال شود و مدت‌زمان را لاگ کن
    e.currentTarget.playbackRate = playbackRate;
    console.log("duration:", e.currentTarget.duration);
  }}
  onError={(e) => {
    console.error("Video error:", e.currentTarget.error);
    alert("پخش ویدئو ناموفق بود. مسیر یا دسترسی‌ها را چک کن.");
  }}
  style={{ width: "100%", borderRadius: 12, background: "#000" }}
/>

    </div>
  );
}
