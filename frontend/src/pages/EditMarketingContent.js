import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
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
  const [url, setUrl] = useState(item?.imageUrl || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewContent, setPreviewContent] = useState(item?.imageUrl || "");

  useEffect(() => {
    if (item) {
      // Reset states whenever item changes
      setUrl(item.imageUrl || "");
      setImageFile(null);
      setPreviewContent(item.imageUrl || null);
    }
  }, [item]);

  //Fetch File
  const handlePickFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewContent(URL.createObjectURL(file)); // show preview immediately
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

      const res = await axios.put(
        `http://localhost:8080/api/content/marketing/${itemId}`,
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

      const res = await axios.put(
        `http://localhost:8080/api/content/marketing/${itemId}`,
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

  const handleDeleteClick = async () => {
    if (!window.confirm("Delete this marketing content?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/content/marketing/${itemId}`, {
        withCredentials: true,
      });
      onDelete?.(itemId);
      alert("Deleted");
      onBack?.();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete");
    }
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
            <textarea className="mc-textarea" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="mc-row mc-row-image">
            <label className="mc-label">Image:</label>
            <div className="mc-image-controls">
              <label className="mc-upload-btn">
                {imageFileName}
                <input type="file" accept="image/*" onChange={handlePickFile} />
              </label>

              {/* IMAGE PREVIEW */}
              <div className="mc-image-preview">
                {previewContent ? (
                  <img
                    src={previewContent}
                    alt="Preview"
                    style={{ maxWidth: "100%", marginTop: "10px", borderRadius: "4px" }}
                  />
                ) : null}
              </div>

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