import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import {router} from "./app/routes.jsx"; // اگر بعداً ارور گرفت، پایین توضیح دادم
import AuthProvider from "./context/AuthContext.jsx";

// ⬅️ مسیر درست و نسبی به CSS سراسری
import "./globalFonts.css";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
