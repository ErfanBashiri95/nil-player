import { createContext, useContext, useEffect, useState, useRef } from "react";
import allowed from "../data/allowedUsers.json";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "nil_auth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const firstLoad = useRef(true);

  // بازیابی از localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
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
    const found = allowed.find((item) => item.username.trim().toLowerCase() === u);
    if (!found) throw new Error("not-allowed");

    const userObj = {
      id: found.username,
      username: found.username,
      course_code: (found.course_code || "").toUpperCase(),
    };

    setUser(userObj);
    // مهم: با تاخیر microtask تا React ست کنه
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("nil:user-changed", { detail: { user: userObj } })
      );
    }, 50);
    return userObj;
  };

  const logout = () => {
    setUser(null);
    setTimeout(() => {
      window.dispatchEvent(new Event("nil:user-logged-out"));
    }, 50);
  };

  // وقتی از localStorage بازیابی شد هم یکبار ایونت بفرست
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      if (user) {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("nil:user-changed", { detail: { user } })
          );
        }, 100);
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
