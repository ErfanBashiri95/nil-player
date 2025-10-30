import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const STORAGE_KEY = "nil_auth";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth() || {};
  const location = useLocation();
  const [bootChecked, setBootChecked] = useState(false);
  const [bootUser, setBootUser] = useState(null);

  // یک بار از localStorage بخوان تا اگر Context دیر ست شد، پرت نشویم
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBootUser(JSON.parse(raw));
    } catch {}
    setBootChecked(true);
  }, []);

  // کاربر مؤثر: اولویت با context و بعد localStorage
  const effectiveUser = useMemo(() => user || bootUser, [user, bootUser]);

  // تا وقتی چک اولیه تمام نشده، چیزی رندر نکن (از چشمک جلوگیری می‌کند)
  if (!bootChecked) return null;

  if (!effectiveUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
