import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import "../styles/overview.css";

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

export default function AdminNavbar() {
  return (
    <div className="tm-shell">
      <aside className="tm-sidebar">
        <div className="tm-brand">
          <div className="tm-brand-badge" aria-hidden="true">
            <div className="tm-brand-pin" />
            <div className="tm-brand-dot" />
          </div>
          <div className="tm-brand-name">TripMate</div>
        </div>

        <nav className="tm-nav">
          <Item to="/admin/overview" label="Overview"  />
          <Item to="/admin/users" label="Users" />
          <Item to="/admin/content" label="Content"  />
          <Item to="/admin/support" label="Support" />
        </nav>

        <div className="tm-sidebar-footer">
          <div className="tm-admin">
            <div className="tm-admin-avatar" aria-hidden="true">👤</div>
            <div className="tm-admin-name">Admin</div>
            <div className="tm-admin-caret" aria-hidden="true">▾</div>
          </div>
        </div>
      </aside>

      <main className="tm-main">
        <Outlet />
      </main>
    </div>
  );
}
