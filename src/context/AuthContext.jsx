import { createContext, useContext, useEffect, useState } from "react";
import allowed from "../data/allowedUsers.json"; // [{ username, course_code }]

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "nil_auth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // ✅ بازیابی از localStorage هنگام لود اولیه
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        // اعلان ورود خودکار (مثلاً وقتی کاربر قبلاً لاگین بوده)
        window.dispatchEvent(
          new CustomEvent("nil-auth:login", { detail: { user: parsed, auto: true } })
        );
      }
    } catch (err) {
      console.error("Auth restore error:", err);
    }
  }, []);

  // ✅ ذخیره یا حذف از localStorage هنگام تغییر user
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

  // ✅ ورود (فقط برای کاربرانی که در allowedUsers.json هستند)
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
      // 🔹 اطلاع‌رسانی سراسری به کل اپ (Helix01, Helix02 و ...)
      window.dispatchEvent(
        new CustomEvent("nil-auth:login", { detail: { user: userObj } })
      );
    } catch (err) {
      console.warn("Dispatch login event failed:", err);
    }

    return userObj;
  };

  // ✅ خروج کاربر
  const logout = () => {
    setUser(null);
    try {
      // 🔹 اطلاع‌رسانی سراسری به کل اپ برای پاک شدن داده‌ها
      window.dispatchEvent(new Event("nil-auth:logout"));
    } catch (err) {
      console.warn("Dispatch logout event failed:", err);
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
