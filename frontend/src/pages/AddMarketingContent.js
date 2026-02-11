import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Axios from '../hooks/Axios'
import "../styles/MarketingContentForm.css";

export default function AddMarketingContent({ onBack, onSaveDraft, onPublish }) {
  const [section, setSection] = useState("Hero Banner");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFileName, setImageFileName] = useState("Upload an image");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageFileName(file.name);
  };

  const handleCancel = () => onBack?.();

  const handleSaveDraft = async () => {
    try {
      const formData = new FormData();
      formData.append("section", section);
      formData.append("title", title);
      formData.append("body", body);
      formData.append("status", "Draft");
      if (imageFile) formData.append("media", imageFile);
      if (url) formData.append("imageUrl", url);

      const res = await Axios.post(
        "/api/marketing",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onSaveDraft?.(res.data);
      alert("Saved as draft");
      onBack?.();
    } catch (err) {
      console.error("Save draft failed", err);
      alert("Failed to save draft");
    }
  };

  const handlePublish = async () => {
    try {
      const formData = new FormData();
      formData.append("section", section);
      formData.append("title", title);
      formData.append("body", body);
      formData.append("status", "Published");
      if (imageFile) formData.append("media", imageFile);
      if (url) formData.append("imageUrl", url);

      const res = await Axios.post(
        "/api/marketing",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onPublish?.(res.data);
      alert("Saved & Published");
      onBack?.();
    } catch (err) {
      console.error("Publish failed", err);
      alert("Failed to publish");
    }
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
            <input
              className="mc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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

          {/* Live Preview */}
          {(imageFile || url) && (
            <div className="mc-image-preview">
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : url}
                alt="Preview"
                style={{ maxWidth: "100%", marginTop: "10px", borderRadius: "4px" }}
              />
            </div>
          )}
        </div>

        <div className="mc-actions">
          <button className="mc-btn mc-btn-muted" type="button" onClick={handleCancel}>
            Cancel
          </button>

          <div className="mc-actions-right">
            <button className="mc-btn mc-btn-secondary"
              type="button"
              onClick={() =>
                setPreviewContent({
                  section,
                  title,
                  body,
                  imageFile,
                  imageUrl: url,
                  author: "Admin",
                  status: "Draft",
                  lastUpdated: new Date().toLocaleString(),
                })
              }
            >
              Preview
            </button>
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
