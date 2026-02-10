import React from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/ViewUserReview.css";

export default function ViewUserReview({ review, onBack }) {
  if (!review) return <div>Loading...</div>;

  return (
    <div className="mc-form-wrap">
      <div className="mc-form-card">
        <div className="mc-form-topline">
          <button className="mc-back" onClick={onBack}>
            <ArrowLeft className="mc-back-icon" />
          </button>
          <div className="mc-form-title">View Review</div>
        </div>

        <div className="mc-form">
          <div className="mc-row">
            <label className="mc-label">User:</label>
            <div className="mc-input">{review.user}</div>
          </div>

          <div className="mc-row">
            <label className="mc-label">Rating:</label>
            <div className="mc-input">{review.rating} / 5</div>
          </div>

          <div className="mc-row">
            <label className="mc-label">Status:</label>
            <div className="mc-input">{review.status}</div>
          </div>

          <div className="mc-row">
            <label className="mc-label">Created:</label>
            <div className="mc-input">{review.created}</div>
          </div>

          <div className="mc-row mc-row-top">
            <label className="mc-label">Review:</label>
            <div className="mc-textarea">{review.review}</div>
          </div>
        </div>

        <div className="mc-actions">
          <button className="mc-btn mc-btn-muted" type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}