import { createContext, useContext, useEffect, useState } from "react";
import allowed from "../data/allowedUsers.json"; // [{ username, course_code }]

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "nil_auth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // هیدریت اولیه از localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setAuthReady(true);
  }, []);

  // ماندگاری وضعیت در localStorage
  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [user]);

  const login = async (username) => {
    const u = String(username || "").trim().toLowerCase();
    const found = allowed.find(item => item.username.trim().toLowerCase() === u);
    if (!found) throw new Error("not-allowed");

    const userObj = {
      id: found.username,
      username: found.username,
      course_code: (found.course_code || "").toUpperCase(),
    };

    setUser(userObj);

    // اطلاع‌رسانی سراسری برای صفحات
    try {
      window.dispatchEvent(new CustomEvent("nil-auth:login", { detail: { user: userObj } }));
    } catch {}
    return userObj;
  };

  const logout = () => {
    const prev = user;
    setUser(null);
    try {
      window.dispatchEvent(new CustomEvent("nil-auth:logout", { detail: { user: prev } }));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}
