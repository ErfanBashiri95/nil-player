import { createContext, useContext, useEffect, useState } from "react";
import allowed from "../data/allowedUsers.json"; // [{ username, course_code }]

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "nil_auth";
const REFRESH_KEY_PREFIX = "nil_auto_refresh_once::";

function clearAutoRefreshFlags() {
  try {
    // پاک کردن همه کلیدهای مربوط به ریفرش خودکار
    const toDelete = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(REFRESH_KEY_PREFIX)) toDelete.push(k);
    }
    toDelete.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}

function clearCurrentPathFlagFor(username) {
  try {
    if (!username) return;
    const key = `${REFRESH_KEY_PREFIX}${username}::${window.location.pathname}`;
    sessionStorage.removeItem(key);
  } catch {}
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

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

  // ورود فقط با یوزرنیم موجود در whitelist
  const login = async (username) => {
    const u = String(username || "").trim().toLowerCase();
    const found = allowed.find(item => item.username.trim().toLowerCase() === u);
    if (!found) throw new Error("not-allowed");

    const userObj = {
      id: found.username,
      username: found.username,
      course_code: (found.course_code || "").toUpperCase()
    };

    // قبل از ست کردن کاربر، فلگ ریفرش همین مسیر برای این کاربر رو پاک کن
    clearCurrentPathFlagFor(userObj.username);
    setUser(userObj);

    // رویداد کمکی برای صفحات (اختیاری)
    try { window.dispatchEvent(new CustomEvent("nil:user-changed", { detail: { username: userObj.username } })); } catch {}
    return userObj;
  };

  const logout = () => {
    // کلیدهای ریفرش خودکار رو پاک کن تا ورود بعدی یک‌بار ریفرش انجام بشه
    clearAutoRefreshFlags();
    setUser(null);
    try { window.dispatchEvent(new Event("nil:user-logged-out")); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
