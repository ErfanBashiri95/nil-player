import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login.jsx";
import Helix01 from "../pages/Helix01.jsx";
import Helix02 from "../pages/Helix02.jsx";
import Empathy from "../pages/Empathy.jsx";
import NotFound from "../pages/NotFound.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const base = import.meta.env.VITE_BASE_PATH || "/";

export const router = createBrowserRouter(
  [
    { path: "/", element: <Login /> },
    // آدرس کمکی برای /login
    { path: "/login", element: <Navigate to="/" replace /> },

    {
      path: "/helix01",
      element: (
        <ProtectedRoute>
          <Helix01 />
        </ProtectedRoute>
      ),
    },
    {
      path: "/helix02",
      element: (
        <ProtectedRoute>
          <Helix02 />
        </ProtectedRoute>
      ),
    },

    // ✅ EMPATHY108 (route جدید)
    {
      path: "/empathy108",
      element: (
        <ProtectedRoute>
          <Empathy />
        </ProtectedRoute>
      ),
    },
    {
      path: "/EMPATHY108",
      element: (
        <ProtectedRoute>
          <Empathy />
        </ProtectedRoute>
      ),
    },

    { path: "*", element: <NotFound /> },
  ],
  { basename: base }
);
