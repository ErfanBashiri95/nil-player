import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLang, setLang, STR } from "../i18n/lang";

export default function HeaderBar() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const lang = getLang();

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const toggleLang = () => {
    setLang(lang === "fa" ? "en" : "fa");
    // یک رفرش سبک برای اعمال متن‌ها
    location.reload();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        insetInlineEnd: 14,
        display: "flex",
        gap: 10,
        zIndex: 40,
      }}
    >
      <button
        onClick={toggleLang}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,.12)",
          border: "1px solid rgba(255,255,255,.25)",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          backdropFilter: "blur(6px)",
        }}
      >
        {lang === "fa" ? "EN" : "FA"}
      </button>

      <button
        onClick={handleLogout}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          background: "linear-gradient(90deg,#1A83CC,#2CA7E3)",
          border: "1px solid rgba(255,255,255,.25)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(26,131,204,.45)",
        }}
      >
        {STR("logout")}
      </button>
    </div>
  );
}
