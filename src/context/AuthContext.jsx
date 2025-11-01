import { createContext, useContext, useEffect, useState, useRef } from "react";
import allowed from "../data/allowedUsers.json";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "nil_auth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const firstLoad = useRef(true);

  // بازیابی از localStorage + نرمال‌سازی به lowercase
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const norm = parsed?.username
          ? {
              ...parsed,
              username: String(parsed.username).trim().toLowerCase(),
              id: String(parsed.username).trim().toLowerCase(),
            }
          : null;
        setUser(norm);
      }
    } catch {}
  }, []);

  // ماندگاری وضعیت
  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [user]);

  const login = async (username) => {
    const u = String(username || "").trim().toLowerCase();
    const found = allowed.find((it) => it.username.trim().toLowerCase() === u);
    if (!found) throw new Error("not-allowed");

    const userObj = {
      id: u,
      username: u, // همیشه lowercase
      course_code: String(found.course_code || "").toUpperCase(),
    };

    setUser(userObj);

    // ایونت اعلام تغییر یوزر (کمی تاخیر تا React setState اعمال شود)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("nil:user-changed", { detail: { user: userObj } }));
    }, 50);

    return userObj;
  };

  const logout = () => {
    setUser(null);
    setTimeout(() => window.dispatchEvent(new Event("nil:user-logged-out")), 30);
  };

  // وقتی از localStorage بالا آمد، یکبار ایونت بده (برای ورود خودکار)
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      if (user) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("nil:user-changed", { detail: { user } }));
        }, 80);
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
