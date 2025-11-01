import { createContext, useContext, useEffect, useState } from "react";
import allowed from "../data/allowedUsers.json"; // [{ username, course_code }]

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "nil_auth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // 🔹 بازیابی از localStorage هنگام لود اولیه
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        // ✅ اعلان برای صفحات که کاربر آماده است
        window.dispatchEvent(new CustomEvent("nil-auth:login", { detail: parsed }));
      }
    } catch (err) {
      console.error("Auth restore error:", err);
    }
  }, []);

  // 🔹 ذخیره یا حذف از localStorage هنگام تغییر user
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error("Auth storage error:", err);
    }
  }, [user]);

  // 🔹 تابع ورود
  const login = async (username) => {
    const u = String(username || "").trim().toLowerCase();
    const found = allowed.find(
      (item) => item.username.trim().toLowerCase() === u
    );
    if (!found) throw new Error("not-allowed");

    const userObj = {
      id: found.username,
      username: found.username,
      course_code: (found.course_code || "").toUpperCase(),
    };

    setUser(userObj);

    try {
      window.dispatchEvent(new CustomEvent("nil-auth:login", { detail: userObj }));
    } catch (err) {
      console.warn("Event dispatch login failed:", err);
    }

    return userObj;
  };

  // 🔹 تابع خروج
  const logout = () => {
    setUser(null);
    try {
      window.dispatchEvent(new Event("nil-auth:logout"));
    } catch (err) {
      console.warn("Event dispatch logout failed:", err);
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
