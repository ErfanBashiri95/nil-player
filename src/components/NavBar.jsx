import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <nav style={{ display:"flex", gap:"16px", padding:"10px", borderBottom:"1px solid #ccc" }}>
      <Link to="/">Login</Link>
      <Link to="/helix01">Helix 01</Link>
      <Link to="/helix02">Helix 02</Link>
      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>Hi, {user.name} ({user.course_code})</span>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <span>Guest</span>
        )}
      </div>
    </nav>
  );
}
