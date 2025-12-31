import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/MarketingContentForm.css";

export default function EditMarketingContent({
  itemId,
  items,
  onBack,
  onDelete,
  onSaveDraft,
  onPublish,
}) {
  const item = useMemo(() => items.find((x) => x.id === itemId), [items, itemId]);

  const [section, setSection] = useState(item?.section || "Hero Banner");
  const [title, setTitle] = useState(item?.title || "");
  const [body, setBody] = useState(item?.body || "");
  const [imageFileName, setImageFileName] = useState("Upload an image");
  const [url, setUrl] = useState(item?.url || "");

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
  };

  const handleCancel = () => onBack?.();

  const handleDeleteClick = () => {
    const ok = window.confirm("Delete this marketing content?");
    if (!ok) return;
    onDelete?.(itemId);
    alert("Deleted");
    onBack?.();
  };

  const handleSaveDraft = () => {
    onSaveDraft?.({
      id: itemId,
      section,
      title,
      body,
      url,
      status: "Draft",
    });
    alert("Saved as draft");
    onBack?.();
  };

  const handlePublish = () => {
    onPublish?.({
      id: itemId,
      section,
      title,
      body,
      url,
      status: "Published",
    });
    alert("Saved & Published");
    onBack?.();
  };

  if (!item) {
    return (
      <div className="mc-form-wrap">
        <div className="mc-form-card">
          <div className="mc-form-topline">
            <button className="mc-back" type="button" onClick={handleCancel}>
              <ArrowLeft className="mc-back-icon" />
            </button>
            <div className="mc-form-title">Edit Marketing Content</div>
          </div>
          <div className="mc-empty">Marketing content not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-form-wrap">
      <div className="mc-form-card">
        <div className="mc-form-topline">
          <button className="mc-back" type="button" onClick={handleCancel}>
            <ArrowLeft className="mc-back-icon" />
          </button>
          <div className="mc-form-title">Edit Marketing Content</div>
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
            <button className="mc-btn mc-btn-danger" type="button" onClick={handleDeleteClick}>
              Delete
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
