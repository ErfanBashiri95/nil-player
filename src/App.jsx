import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Helix01 from "./pages/Helix01";
import Helix02 from "./pages/Helix02";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* صفحه لاگین */}
        <Route path="/" element={<Login />} />

        {/* مسیرهای دوره‌ها - هم lowercase هم Capital برای اطمینان */}
        <Route path="/helix01" element={<Helix01 />} />
        <Route path="/Helix01" element={<Helix01 />} />

        <Route path="/helix02" element={<Helix02 />} />
        <Route path="/Helix02" element={<Helix02 />} />

        {/* هر چیز دیگری → لاگین */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
