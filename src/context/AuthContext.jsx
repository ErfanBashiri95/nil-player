import { createContext, useContext, useEffect, useState } from "react";
import allowed from "../data/allowedUsers.json";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "nil_auth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // persist to localStorage
  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [user]);

  const login = async (username) => {
    const u = String(username || "").trim().toLowerCase();
    const found = allowed.find(x => x.username.trim().toLowerCase() === u);
    if (!found) throw new Error("not-allowed");

    const userObj = {
      id: found.username,
      username: found.username,
      course_code: (found.course_code || "").toUpperCase(),
    };

    setUser(userObj);
    // مهم: بعد از ست شدن state ایونت را بفرست
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent("nil:user-changed", { detail: { user: userObj }}));
    });

    return userObj;
  };

  const logout = () => {
    setUser(null);
    queueMicrotask(() => {
      window.dispatchEvent(new Event("nil:user-logged-out"));
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
