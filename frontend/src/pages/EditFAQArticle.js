import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import "../styles/FAQArticle.css";
import { mockFAQs } from "../data/mockSupport";

export default function EditFAQArticle({ faqId, onBack, onDelete, onSaveDraft, onPublish }) {
  const faq = useMemo(() => mockFAQs.find((f) => f.id === faqId), [faqId]);

  const [category, setCategory] = useState(faq?.category || "Account");
  const [question, setQuestion] = useState(faq?.question || "");
  const [answer, setAnswer] = useState(faq?.answer || ""); // if you add answers later

  const handleCancel = () => onBack?.();

  const handleDelete = () => {
    const ok = window.confirm("Delete this FAQ article?");
    if (!ok) return;
    onDelete?.(faqId);
    alert("Deleted");
    onBack?.();
  };

  const handleSaveDraft = () => {
    const payload = { id: faqId, category, question, answer, status: "Draft" };
    onSaveDraft?.(payload);
    alert("Saved as draft");
    onBack?.();
  };

  const handlePublish = () => {
    const payload = { id: faqId, category, question, answer, status: "Published" };
    onPublish?.(payload);
    alert("Saved & Published");
    onBack?.();
  };

  if (!faq) {
    return (
      <div className="faq-page">

        <div className="faq-card">
          <div className="faq-topline">
            <button className="faq-back" type="button" onClick={handleCancel}>
              <ArrowLeft className="faq-back-icon" />
            </button>
            <div className="faq-title">Edit FAQ Article</div>
          </div>

          <div className="faq-empty">FAQ not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="faq-page">

      <div className="faq-card">
        <div className="faq-topline">
          <button className="faq-back" type="button" onClick={handleCancel}>
            <ArrowLeft className="faq-back-icon" />
          </button>
          <div className="faq-title">Edit FAQ Article</div>
        </div>

        <div className="faq-form">
          <div className="faq-row">
            <label className="faq-label">Category:</label>
            <select
              className="faq-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Account</option>
              <option>Trip</option>
              <option>Payment</option>
              <option>Support</option>
              <option>Itinerary</option>
            </select>
          </div>

          <div className="faq-row">
            <label className="faq-label">Question:</label>
            <input
              className="faq-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="faq-row faq-row-top">
            <label className="faq-label">Answer:</label>
            <textarea
              className="faq-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>
        </div>

        <div className="faq-actions">
          <button className="faq-btn faq-btn-muted" type="button" onClick={handleCancel}>
            Cancel
          </button>

          <div className="faq-actions-right">
            <button className="faq-btn faq-btn-danger" type="button" onClick={handleDelete}>
              Delete
            </button>
            <button className="faq-btn faq-btn-muted" type="button" onClick={handleSaveDraft}>
              Save as draft
            </button>
            <button className="faq-btn faq-btn-primary" type="button" onClick={handlePublish}>
              Save &amp; Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
