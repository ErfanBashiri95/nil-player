export default function PageLoader({ show = false }) {
    if (!show) return null;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6,10,20,.85)",
          display: "grid",
          placeItems: "center",
          zIndex: 60,
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "4px solid rgba(255,255,255,.25)",
              borderTopColor: "#2CA7E3",
              animation: "nilspin 0.9s linear infinite",
            }}
          />
          <div style={{ color: "#fff", opacity: .85, fontWeight: 700 }}>در حال بارگذاری...</div>
        </div>
        <style>{`@keyframes nilspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  