import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import "../styles/UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();
  const { id } = useParams(); 

  const [status, setStatus] = useState("Active");
  const [role, setRole] = useState("User");

  const userItineraries = useMemo(
    () => [
      {
        title: "Street Art and Coffee Trails in Berlin",
        id: "23165",
        date: "2025-11-05",
        status: "Published",
      },
      {
        title: "6DSN Guide to Tokyo",
        id: "75678",
        date: "2025-11-05",
        status: "Published",
      },
    ],
    []
  );

  const userReviews = useMemo(
    () => [
      {
        text: "Wow. This website actually made me like planni...",
        id: "1253",
        date: "2025-11-05",
        status: "Published",
      },
      {
        text: "First time user! Slightly confusing but I think it ha...",
        id: "1124",
        date: "2025-11-04",
        status: "Published",
      },
    ],
    []
  );

  if (!user) {
    return (
      <div className="up-page">
        <div className="up-not-found">User not found</div>
      </div>
    );
  }

  const handleSendResetLink = () => {
    alert(`Password reset link has been sent to ${user.email}`);
  };

  const handleDeleteAccount = () => {
    const ok = window.confirm(
      `Are you sure you want to permanently delete ${user.name}'s account? This action cannot be undone and will remove all associated data.`
    );
    if (!ok) return;
    alert(`Account for ${user.name} has been deleted.`);
    navigate(-1);
  };

  const handleSuspendToggle = () => {
    const newStatus = status === "Active" ? "Suspended" : "Active";
    setStatus(newStatus);
    alert(
      `User ${user.name} has been ${
        newStatus === "Suspended" ? "suspended" : "activated"
      }.`
    );
  };

  const handleViewItinerary = (itId, title) =>
    alert(`Viewing itinerary: ${title} (${itId})`);
  const handleDeleteItinerary = (itId, title) => {
    const ok = window.confirm(`Are you sure you want to delete "${title}"?`);
    if (!ok) return;
    alert(`Itinerary "${title}" has been deleted.`);
  };

  const handleViewReview = (reviewId) => alert(`Viewing review ${reviewId}`);
  const handleFeatureReview = (reviewId) =>
    alert(`Review ${reviewId} has been featured.`);
  const handleDeleteReview = (reviewId) => {
    const ok = window.confirm("Are you sure you want to delete this review?");
    if (!ok) return;
    alert(`Review ${reviewId} has been deleted.`);
  };

  return (
    <div className="up-page">
      <div className="up-header">
        <h1>User Management</h1>
        <p>Manage users and account permissions</p>
      </div>

      <div className="up-shell">
        <div className="up-card up-card-main">
          {/* ✅ Back uses router history */}
          <button className="up-back" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft className="up-back-icon" />
            <span>
              User Profile — {user.name} (#{user.id})
            </span>
          </button>

          <div className="up-grid-2">
            <div className="up-panel">
              <div className="up-panel-title">User Information</div>

              <div className="up-info">
                <div className="up-info-row">
                  <span className="up-label">Name:</span>
                  <span className="up-value">{user.name}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-label">Email:</span>
                  <span className="up-value">{user.email}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-label">Joined:</span>
                  <span className="up-value">{user.dateJoined}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-label">Last Login:</span>
                  <span className="up-value">{user.lastLogin}</span>
                </div>
              </div>
            </div>

            <div className="up-panel">
              <div className="up-panel-title">Admin Controls</div>

              <div className="up-controls">
                <div className="up-control-row">
                  <span className="up-label">Status:</span>

                  <span
                    className={`up-status-pill ${
                      status === "Active" ? "is-active" : "is-suspended"
                    }`}
                  >
                    {status}
                  </span>

                  <button
                    className="up-btn up-btn-ghost"
                    type="button"
                    onClick={handleSuspendToggle}
                  >
                    Suspend
                  </button>
                </div>

                <div className="up-control-row">
                  <span className="up-label">Role:</span>

                  <div className="up-select-wrap">
                    <select
                      className="up-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                      <option value="Moderator">Moderator</option>
                    </select>
                    <ChevronDown className="up-select-icon" />
                  </div>
                </div>

                <div className="up-control-row">
                  <span className="up-label">Password Reset:</span>
                  <button
                    className="up-btn up-btn-primary"
                    type="button"
                    onClick={handleSendResetLink}
                  >
                    Send Reset Link
                  </button>
                </div>

                <div className="up-control-row">
                  <span className="up-label"></span>
                  <button
                    className="up-btn up-btn-danger-soft"
                    type="button"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="up-grid-2 up-grid-2-gap">
            <div className="up-panel">
              <div className="up-panel-title">Activity Summary</div>

              <div className="up-kv">
                <div className="up-kv-row">
                  <span>Itineraries Created:</span>
                  <strong>10</strong>
                </div>
                <div className="up-kv-row">
                  <span>Reviews Posted:</span>
                  <strong>4</strong>
                </div>
                <div className="up-kv-row">
                  <span>Support Tickets:</span>
                  <strong>1</strong>
                </div>
              </div>
            </div>

            <div className="up-panel">
              <div className="up-panel-title">Flags &amp; Reports</div>

              <div className="up-kv">
                <div className="up-kv-row">
                  <span>Reports made against user:</span>
                  <strong>0</strong>
                </div>
                <div className="up-kv-row">
                  <span>Reports made by user:</span>
                  <strong>1</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="up-panel up-panel-wide">
            <div className="up-panel-title">Itineraries</div>

            <div className="up-list">
              {userItineraries.map((it) => (
                <div className="up-list-row" key={it.id}>
                  <div className="up-list-left">
                    <div className="up-list-title">{it.title}</div>
                    <div className="up-list-sub">
                      {it.id} | {it.date}
                    </div>
                  </div>

                  <div className="up-list-right">
                    <span className="up-muted">{it.status}</span>
                    <button
                      className="up-link"
                      type="button"
                      onClick={() => handleViewItinerary(it.id, it.title)}
                    >
                      View
                    </button>
                    <button
                      className="up-link up-link-muted"
                      type="button"
                      onClick={() => handleDeleteItinerary(it.id, it.title)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="up-panel up-panel-wide">
            <div className="up-panel-title">Reviews</div>

            <div className="up-list">
              {userReviews.map((rv) => (
                <div className="up-list-row" key={rv.id}>
                  <div className="up-list-left">
                    <div className="up-list-title">{rv.text}</div>
                    <div className="up-list-sub">
                      {rv.id} | {rv.date}
                    </div>
                  </div>

                  <div className="up-list-right">
                    <span className="up-muted">{rv.status}</span>
                    <button
                      className="up-link"
                      type="button"
                      onClick={() => handleViewReview(rv.id)}
                    >
                      View
                    </button>
                    <button
                      className="up-link up-link-muted"
                      type="button"
                      onClick={() => handleFeatureReview(rv.id)}
                    >
                      Feature
                    </button>
                    <button
                      className="up-link up-link-muted"
                      type="button"
                      onClick={() => handleDeleteReview(rv.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
