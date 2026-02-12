import React from "react";
import { useNavigate } from "react-router-dom"; 
import { Outlet, NavLink } from "react-router-dom";
import "../styles/overview.css";
import Logo from "../Assets/Logo.jpg"; 
import Axios from '../hooks/Axios'

function Item({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "tm-nav-item" + (isActive ? " tm-nav-item--active" : "")
      }
      end
    >
      <span className="tm-nav-ico" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

//LogOut Function
export default function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await Axios.post(
        "AuthService/logout",
        {},
        { withCredentials: true }
      );

      // Clear client-side auth state
      localStorage.clear();
      sessionStorage.clear();

      // Prevent browser back navigation
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="tm-shell">
      <aside className="tm-sidebar">
        <div className="tm-brand">
          <div className="tm-brand-badge" aria-hidden="true">
            <img
              src= {Logo}  // replace with your logo path
              alt="TripMate Logo"
              className="tm-brand-logo"
            />
            <div className="tm-brand-pin" />
            <div className="tm-brand-dot" />
          </div>
          <div className="tm-brand-name">TripMate</div>
        </div>

        <nav className="tm-nav">
          <Item to="/admin/overview" label="Overview" />
          <Item to="/admin/users" label="Users" />
          <Item to="/admin/content" label="Content" />
          <Item to="/admin/support" label="Support" />
        </nav>

        

        <div className="tm-sidebar-footer">
          <div className="tm-admin">
            <div className="tm-admin-avatar" aria-hidden="true">👤</div>
            <div className="tm-admin-name">Admin</div>
            <div className="tm-admin-caret" aria-hidden="true">▾</div>
          </div>

          <button className="tm-btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="tm-main">
        <Outlet />
      </main>
    </div>
  );
}