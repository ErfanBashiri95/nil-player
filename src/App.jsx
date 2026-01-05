import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Helix01 from "./pages/Helix01";
import Helix02 from "./pages/Helix02";
import Empathy from "./pages/Empathy";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* صفحه لاگین */}
        <Route path="/" element={<Login />} />

        {/* Helix01 */}
        <Route path="/helix01" element={<Helix01 />} />
        <Route path="/Helix01" element={<Helix01 />} />

        {/* Helix02 */}
        <Route path="/helix02" element={<Helix02 />} />
        <Route path="/Helix02" element={<Helix02 />} />

        {/* EMPATHY108 */}
        <Route path="/empathy108" element={<Empathy />} />
        <Route path="/EMPATHY108" element={<Empathy />} />

        {/* هر چیز دیگری → لاگین */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
