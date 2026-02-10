import React from "react";
import "../styles/MarketingPreview.css";
import { ArrowLeft } from "lucide-react";

export default function MarketingPreview({ content, onBack }) {
  if (!content) return null;

  const { section, title, body, imageFile, imageUrl, author, status, lastUpdated } = content;

  // Use local file preview if available, else use URL
  const displayImage = imageFile ? URL.createObjectURL(imageFile) : imageUrl || null;

  return (
    <div className="mp-wrap">
      <div className="mp-card">
        <div className="mp-header">
          <button className="mp-back" type="button" onClick={onBack}>
            <ArrowLeft /> Back
          </button>
          <h2>Marketing Content Preview</h2>
        </div>

        <div className="mp-body">
          <p><strong>Section:</strong> {section}</p>
          <p><strong>Title:</strong> {title}</p>
          <p><strong>Body:</strong> {body}</p>

          {displayImage && (
            <div className="mp-image">
              <img src={displayImage} alt={title} />
            </div>
          )}

          <p><strong>Author:</strong> {author || "Admin"}</p>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Last Updated:</strong> {lastUpdated}</p>
        </div>

        <div className="mp-actions">
          <button className="mp-btn" onClick={onBack}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}