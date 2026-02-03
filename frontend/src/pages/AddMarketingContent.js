import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/MarketingContentForm.css";

export default function AddMarketingContent({ onBack, onSaveDraft, onPublish }) {
  const [section, setSection] = useState("Hero Banner");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFileName, setImageFileName] = useState("Upload an image");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState(null); // Select Photo

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageFileName(file.name);
  };
  
  const handleCancel = () => onBack?.();

  const handleSaveDraft = () => {
    onSaveDraft?.({
      section,
      title,
      body,
      imageFile,   // file object
      imageUrl: url,   // text field
      status: "Draft",
    });
    alert("Saved as draft");
    onBack?.();
  };

  const handlePublish = () => {
    onPublish?.({
      section,
      title,
      body,
      imageFile,   // file object
      imageUrl: url,   // text field
      status: "Published",
    });
    alert("Saved & Published");
    onBack?.();
  };

  return (
    <div className="mc-form-wrap">
      <div className="mc-form-card">
        <div className="mc-form-topline">
          <button className="mc-back" type="button" onClick={handleCancel}>
            <ArrowLeft className="mc-back-icon" />
          </button>
          <div className="mc-form-title">Add New Marketing Content</div>
        </div>

        <div className="mc-form">
          <div className="mc-row">
            <label className="mc-label">Section:</label>
            <select
              className="mc-select"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              <option>Hero Banner</option>
              <option>Logo</option>
              <option>Features</option>
              <option>Pricing</option>
            </select>
          </div>

          <div className="mc-row">
            <label className="mc-label">Title:</label>
            <input className="mc-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="mc-row mc-row-top">
            <label className="mc-label">Body:</label>
            <textarea
              className="mc-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="mc-row mc-row-image">
            <label className="mc-label">Image:</label>

            <div className="mc-image-controls">
              <label className="mc-upload-btn">
                {imageFileName}
                <input type="file" accept="image/*" onChange={handlePickFile} />
              </label>

              <span className="mc-url-label">URL:</span>
              <input
                className="mc-input mc-url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mc-actions">
          <button className="mc-btn mc-btn-muted" type="button" onClick={handleCancel}>
            Cancel
          </button>

          <div className="mc-actions-right">
            <button className="mc-btn mc-btn-muted" type="button" onClick={handleSaveDraft}>
              Save as draft
            </button>
            <button className="mc-btn mc-btn-primary" type="button" onClick={handlePublish}>
              Save &amp; Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
