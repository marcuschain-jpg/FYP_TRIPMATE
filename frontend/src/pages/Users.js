import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Users.css";
import Axios from '../hooks/Axios';
import { useEffect } from "react";

/* ---- CONFIRM MODAL ---- */
function ConfirmModal({ title, message, onConfirm, onClose }) {
  return (
    <div className="um-modal-backdrop">
      <div className="um-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="um-modal-actions">
          <button className="btn btn-danger" onClick={onConfirm} type="button">
            Confirm
          </button>
          <button className="btn" onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- NOTIFICATION ---- */
function Notification({ onClose }) {
  return (
    <div className="um-toast">
      <h4>User details updated</h4>
      <p>Your changes have been successfully updated.</p>
      <div className="um-toast-actions">
        <button className="btn btn-link" onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  );
}

export default function Users() {
  const navigate = useNavigate();

  // Data

  // const [users, setUsers] = useState(mockUsers);
  const [users, setUsers] = useState([]);

  //Create Real Time Activity Logs
  const [activityLog, setActivityLog] = useState([]);

  //Ticket Summary
  const [ticketCounts, setTicketCounts] = useState({
    total: 0,
    pending: 0
  });

  const fetchTicketCounts = async () => {
    try {
      const res = await Axios.get("api/support", {
        withCredentials: true,
      });

      const tickets = res.data;

      const newTicketsCount = tickets.filter(
        t => t.status.toUpperCase() === "NEW"
      ).length;

      const pendingCount = tickets.filter(
        t => t.status.toUpperCase() === "PENDING"
      ).length;

      setTicketCounts({
        new: newTicketsCount,
        pending: pendingCount
      });
    } catch (err) {
      console.error("Failed to fetch ticket counts", err);
    }
  };

  // Call on mount
  useEffect(() => {
    fetchTicketCounts(); // initial fetch
    const interval = setInterval(fetchTicketCounts, 10000); // every 10 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  //Add Changes
  const loadActivityLogs = () => {
    Axios
      .get("api/users/activity", {
        withCredentials: true,
      })
      .then((res) => setActivityLog(res.data))
      .catch((err) => console.error("Failed to load activity logs", err));
  };

  useEffect(() => {
    loadActivityLogs();
  }, []);

  // Load Data from DB
  useEffect(() => {
    Axios
      .get("api/users", {
        withCredentials: true,
      })
      .then((response) => {
        setUsers(response.data);
        
        loadActivityLogs();
      })
      .catch((err) => {
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          const errorMsg =
            err.response.status + ": " + err.response.data?.message;
          navigate(`/login/${errorMsg}`);
        } else {
          console.error("Failed to load users", err);
        }
      });
  }, [navigate]);

  //Capitalize Words in Status
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // Filters / UI state
  const [statusFilter, setStatusFilter] = useState("All"); // All | Active | Suspended
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((u) => {
      const statusOk = statusFilter === "All" ? true : u.status === statusFilter;

      const searchOk =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.id.includes(q);

      return statusOk && searchOk;
    });
  }, [users, statusFilter, search]);

  const allVisibleSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id));

  const toggleSelectAllVisible = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredUsers.forEach((u) => {
        if (checked) next.add(u.id);
        else next.delete(u.id);
      });
      return next;
    });
  };

  const toggleSelectOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  //Updated Suspend Function
  const confirmSuspend = (user) => {
    setModal({
      title: user.status === "Active" ? "Suspend User" : "Activate User",
      message: `Are you sure you want to ${
        user.status === "Active" ? "suspend" : "activate"
      } ${user.name}?`,
      action: () => {
        Axios
          .patch(`api/users/${user.id}/suspend`, null, {
            withCredentials: true,
          })
          .then((res) => {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === user.id
                  ? { ...u, status: res.data.status }
                  : u
              )
            );

            loadActivityLogs();

            setShowToast(true);
          })
          .catch((err) => console.error("Suspend failed", err))
          .finally(() => setModal(null));
      },
    });
  };

  //Updated Delete Function
  const confirmDelete = (user) => {
    setModal({
      title: "Delete User",
      message: `Delete ${user.name}? This action cannot be undone.`,
      action: () => {
        Axios
          .delete(`api/users/${user.id}`, {
            withCredentials: true,
          })
          .then(() => {
            setUsers((prev) => prev.filter((u) => u.id !== user.id));

            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(user.id);
              return next;
            });

            loadActivityLogs();

            setShowToast(true);
          })
          .catch((err) => console.error("Delete failed", err))
          .finally(() => setModal(null));
      },
    });
  };

  return (
    <div className="tm-page">
      {showToast && <Notification onClose={() => setShowToast(false)} />}

      <header className="um-header">
        <h1>User Management</h1>
        <p>Manage users and account permissions</p>
      </header>

      <section className="um-panels">
        <div className="tm-card">
          <h3>User Activity Log</h3>
          <ul className="um-log">
            {activityLog.slice(0, 6).map((log, index) => (
              <li key={index}>{log}</li>
            ))}
            {activityLog.length === 0 && (
              <li style={{ color: "#64748b" }}>No recent activity</li>
            )}
          </ul>
        </div>

        <div className="tm-card um-tickets">
          <h3>Support Tickets / Reports</h3>
          <p>{ticketCounts.new} New Tickets</p>
          <p>{ticketCounts.pending} Tickets Pending for Review/Resolve</p>
        </div>
        </section>

      <section className="tm-card">
        {/* Filter/Search row */}
        <div className="um-toolbar">
          <div className="um-filters">
            <span className="um-filters-label">Filters:</span>
            <div className="um-filter-tabs">
              {["All", "Active", "Suspended"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`um-tab ${statusFilter === t ? "is-active" : ""}`}
                  onClick={() => setStatusFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="um-toolbar-right">
            <div className="um-search">
              <span className="um-search-icon">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email"
                aria-label="Search by email"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                    aria-label="Select all visible users"
                  />
                </th>
                <th>UserID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date Joined</th>
                <th>Last Login</th>
                <th>Posts</th>
                <th>Flags</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={(e) => toggleSelectOne(u.id, e.target.checked)}
                      aria-label={`Select user ${u.email}`}
                    />
                  </td>
                  <td>#{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{capitalize(u.status)}</td>
                  <td>{u.dateJoined}</td>
                  <td>{u.lastLogin}</td>
                  <td>{u.posts}</td>
                  <td>{u.flags}</td>
                  <td className="um-actions">
                    <button type="button" onClick={() => confirmSuspend(u)}>
                      {u.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                    <button type="button" onClick={() => confirmDelete(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 16, textAlign: "center" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="um-table-footer">
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{users.length}</strong> users
          </div>
        </div>
      </section>

      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          onConfirm={modal.action}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
