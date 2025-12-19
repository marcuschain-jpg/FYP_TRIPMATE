// src/pages/Support.js
import React, { useEffect, useMemo, useState } from "react";
import { Search, Paperclip } from "lucide-react";
import "../styles/Support.css";

import {
  mockTickets as initialTickets,
  mockFAQs as initialFAQs,
} from "../data/mockSupport";

import AddFAQArticle from "./AddFAQArticle";
import EditFAQArticle from "./EditFAQArticle";

export default function Support() {
  const [activeTab, setActiveTab] = useState("tickets"); // "tickets" | "faq"

  // ✅ tickets are stateful so status/priority updates reflect in list
  const [tickets, setTickets] = useState(initialTickets);

  // ✅ FAQs are stateful so add/edit/delete updates the table
  const [faqs, setFaqs] = useState(() =>
    initialFAQs.map((f) => ({
      ...f,
      answer: f.answer || "",
    }))
  );

  // Tickets UI state
  const [selectedTicketId, setSelectedTicketId] = useState(
    initialTickets[2]?.id || initialTickets[0]?.id || null
  );
  const [ticketSearch, setTicketSearch] = useState("");
  const [responseText, setResponseText] = useState("");

  const [statusFilters, setStatusFilters] = useState({
    new: false,
    open: false,
    pending: false,
    resolved: false,
  });

  const [priorityFilters, setPriorityFilters] = useState({
    all: true,
    low: false,
    medium: false,
    high: false,
  });

  // FAQ "sub-pages" inside Support
  const [faqMode, setFaqMode] = useState("list"); // list | add | edit
  const [editingFaqId, setEditingFaqId] = useState(null);

  // ✅ FAQ search
  const [faqSearch, setFaqSearch] = useState("");

  const selectedTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const hasActiveStatus = Object.values(statusFilters).some(Boolean);
      const statusKey = ticket.status.toLowerCase(); // new/open/pending/resolved
      const matchesStatus = !hasActiveStatus || statusFilters[statusKey];

      const priorityKey = ticket.priority.toLowerCase(); // low/medium/high
      const matchesPriority =
        priorityFilters.all || priorityFilters[priorityKey];

      const matchesSearch =
        !q ||
        ticket.userEmail.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q);

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tickets, ticketSearch, statusFilters, priorityFilters]);

  // ✅ FAQ filtering by question/category (and answer if present)
  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    if (!q) return faqs;

    return faqs.filter((f) => {
      return (
        f.question.toLowerCase().includes(q) ||
        (f.category || "").toLowerCase().includes(q) ||
        (f.answer || "").toLowerCase().includes(q)
      );
    });
  }, [faqs, faqSearch]);

  // ✅ if filters/search remove the selected ticket, auto-select first visible one
  useEffect(() => {
    if (activeTab !== "tickets") return;
    if (!filteredTickets.length) return;

    const stillVisible = filteredTickets.some((t) => t.id === selectedTicketId);
    if (!stillVisible) setSelectedTicketId(filteredTickets[0].id);
  }, [activeTab, filteredTickets, selectedTicketId]);

  const updateSelectedTicket = (patch) => {
    if (!selectedTicket) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id ? { ...t, ...patch } : t
      )
    );
  };

  const handleSendResponse = () => {
    if (!selectedTicket) return;
    if (!responseText.trim()) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const stamp = `${hh}:${mm}`;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  sender: "Admin01",
                  content: responseText.trim(),
                  timestamp: stamp,
                },
              ],
            }
          : t
      )
    );

    setResponseText("");
    alert(`Response sent to ticket #${selectedTicket.id}`);
  };

  const handleAttach = () => alert("Attach file dialog would open here");
  const handleCancel = () => setResponseText("");

  // Filter helpers
  const setPriority = (key, checked) => {
    if (key === "all") {
      setPriorityFilters({
        all: checked,
        low: false,
        medium: false,
        high: false,
      });
      return;
    }
    setPriorityFilters((prev) => ({ ...prev, all: false, [key]: checked }));
  };

  const toggleStatus = (key, checked) => {
    setStatusFilters((prev) => ({ ...prev, [key]: checked }));
  };

  // ---- FAQ actions (wired to Add/Edit pages) ----
  const handleAddArticle = () => {
    setFaqMode("add");
    setEditingFaqId(null);
  };

  const handleViewFAQ = (id) => {
    setEditingFaqId(id);
    setFaqMode("edit");
  };

  const handleDeleteFAQ = (id) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSaveDraftFAQ = (payload) => {
    const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);

    if (payload.id) {
      // edit existing
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === payload.id
            ? {
                ...f,
                category: payload.category,
                question: payload.question,
                answer: payload.answer,
                status: payload.status || f.status,
                lastUpdated: stamp,
              }
            : f
        )
      );
    } else {
      // add new
      const newId = `f${Date.now()}`;
      setFaqs((prev) => [
        {
          id: newId,
          question: payload.question,
          answer: payload.answer,
          category: payload.category,
          status: payload.status || "Draft",
          lastUpdated: stamp,
        },
        ...prev,
      ]);
    }
  };

  const handlePublishFAQ = (payload) => {
    handleSaveDraftFAQ({ ...payload, status: "Published" });
  };

  return (
    <div className="sc-page">
      <header className="sc-header">
        <h1>Support Centre</h1>
        <p>Manage support tickets and FAQ articles</p>
      </header>

      {/* FAQ add/edit "pages" */}
      {activeTab === "faq" && faqMode === "add" && (
        <AddFAQArticle
          onBack={() => setFaqMode("list")}
          onSaveDraft={(payload) => {
            handleSaveDraftFAQ(payload);
            setFaqMode("list");
          }}
          onPublish={(payload) => {
            handlePublishFAQ(payload);
            setFaqMode("list");
          }}
        />
      )}

      {activeTab === "faq" && faqMode === "edit" && (
        <EditFAQArticle
          faqId={editingFaqId}
          onBack={() => setFaqMode("list")}
          onDelete={(id) => {
            handleDeleteFAQ(id);
            setFaqMode("list");
          }}
          onSaveDraft={(payload) => {
            handleSaveDraftFAQ(payload);
            setFaqMode("list");
          }}
          onPublish={(payload) => {
            handlePublishFAQ(payload);
            setFaqMode("list");
          }}
        />
      )}

      {/* Main card (Tickets + FAQ list) */}
      {(activeTab !== "faq" || faqMode === "list") && (
        <div className="sc-card">
          <div className="sc-tabs">
            <button
              type="button"
              className={`sc-tab ${activeTab === "tickets" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("tickets");
                setFaqMode("list");
                setEditingFaqId(null);
              }}
            >
              Tickets
            </button>
            <button
              type="button"
              className={`sc-tab ${activeTab === "faq" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("faq");
                setFaqMode("list");
                setEditingFaqId(null);
              }}
            >
              FAQ
            </button>
          </div>

          {activeTab === "tickets" ? (
            <div className="sc-tickets">
              {/* Left */}
              <aside className="sc-left">
                <div className="sc-left-block">
                  <div className="sc-search">
                    <Search className="sc-search-icon" />
                    <input
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Search by email"
                      aria-label="Search tickets by email"
                    />
                  </div>
                </div>

                <div className="sc-left-block sc-filters">
                  <div className="sc-filter-group">
                    <div className="sc-filter-title">Status</div>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={statusFilters.new}
                        onChange={(e) =>
                          toggleStatus("new", e.target.checked)
                        }
                      />
                      <span>New</span>
                    </label>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={statusFilters.open}
                        onChange={(e) =>
                          toggleStatus("open", e.target.checked)
                        }
                      />
                      <span>Open</span>
                    </label>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={statusFilters.pending}
                        onChange={(e) =>
                          toggleStatus("pending", e.target.checked)
                        }
                      />
                      <span>Pending</span>
                    </label>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={statusFilters.resolved}
                        onChange={(e) =>
                          toggleStatus("resolved", e.target.checked)
                        }
                      />
                      <span>Resolved</span>
                    </label>
                  </div>

                  <div className="sc-filter-group">
                    <div className="sc-filter-title">Priority</div>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={priorityFilters.all}
                        onChange={(e) =>
                          setPriority("all", e.target.checked)
                        }
                      />
                      <span>All</span>
                    </label>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={priorityFilters.low}
                        onChange={(e) =>
                          setPriority("low", e.target.checked)
                        }
                      />
                      <span>Low</span>
                    </label>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={priorityFilters.medium}
                        onChange={(e) =>
                          setPriority("medium", e.target.checked)
                        }
                      />
                      <span>Medium</span>
                    </label>

                    <label className="sc-check">
                      <input
                        type="checkbox"
                        checked={priorityFilters.high}
                        onChange={(e) =>
                          setPriority("high", e.target.checked)
                        }
                      />
                      <span>High</span>
                    </label>
                  </div>
                </div>
              </aside>

              {/* Middle */}
              <section className="sc-mid">
                <div className="sc-list">
                  {filteredTickets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`sc-ticket-row ${
                        selectedTicketId === t.id ? "is-active" : ""
                      }`}
                      onClick={() => setSelectedTicketId(t.id)}
                    >
                      <div className="sc-ticket-row-top">
                        <div className="sc-ticket-title">
                          <span className="sc-ticket-hash">#{t.id}</span>{" "}
                          {t.title}
                        </div>
                        <div className="sc-ticket-priority">{t.priority}</div>
                      </div>

                      <div className="sc-ticket-user">{t.user}</div>
                      <div className="sc-ticket-status">{t.status}</div>
                    </button>
                  ))}

                  {filteredTickets.length === 0 && (
                    <div className="sc-empty">No tickets found.</div>
                  )}
                </div>
              </section>

              {/* Right */}
              <section className="sc-right">
                {selectedTicket ? (
                  <>
                    <div className="sc-detail-head">
                      <div className="sc-detail-head-left">
                        <div className="sc-detail-title">
                          #{selectedTicket.id} - {selectedTicket.title}
                        </div>
                        <div className="sc-detail-meta">
                          <div>
                            User: {selectedTicket.user} (
                            {selectedTicket.userEmail})
                          </div>
                          <div>Created: {selectedTicket.created}</div>
                        </div>
                      </div>

                      <div className="sc-detail-controls">
                        <select
                          className="sc-select"
                          value={selectedTicket.status}
                          onChange={(e) =>
                            updateSelectedTicket({ status: e.target.value })
                          }
                        >
                          <option>Pending</option>
                          <option>Open</option>
                          <option>Resolved</option>
                          <option>New</option>
                        </select>

                        <select
                          className="sc-select"
                          value={selectedTicket.priority}
                          onChange={(e) =>
                            updateSelectedTicket({ priority: e.target.value })
                          }
                        >
                          <option>Medium</option>
                          <option>Low</option>
                          <option>High</option>
                        </select>
                      </div>
                    </div>

                    <div className="sc-messages">
                      {selectedTicket.messages.length === 0 ? (
                        <div className="sc-empty-msg">No messages yet.</div>
                      ) : (
                        selectedTicket.messages.map((m, idx) => (
                          <div className="sc-message" key={idx}>
                            <div className="sc-message-head">
                              <span className="sc-message-sender">
                                {m.sender}
                              </span>
                              <span className="sc-message-time">
                                {m.timestamp}
                              </span>
                            </div>
                            <div className="sc-message-bubble">{m.content}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="sc-compose">
                      <textarea
                        className="sc-textarea"
                        placeholder="Type response..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={5}
                      />
                      <div className="sc-compose-actions">
                        <button
                          type="button"
                          className="sc-attach"
                          onClick={handleAttach}
                        >
                          <Paperclip className="sc-attach-icon" />
                          Attach file
                        </button>

                        <div className="sc-compose-right">
                          <button
                            type="button"
                            className="sc-btn"
                            onClick={handleCancel}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="sc-btn sc-btn-primary"
                            onClick={handleSendResponse}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="sc-empty-right">
                    Select a ticket to view details
                  </div>
                )}
              </section>
            </div>
          ) : (
            // FAQ LIST VIEW
            <div className="sc-faq">
              <div className="sc-faq-toolbar">
                <div className="sc-search sc-search-wide">
                  <Search className="sc-search-icon" />
                  <input
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search by FAQs"
                    aria-label="Search FAQs"
                  />
                </div>

                <button
                  type="button"
                  className="sc-btn sc-btn-primary"
                  onClick={handleAddArticle}
                >
                  + Add Article
                </button>
              </div>

              <div className="sc-faq-table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th className="sc-col-sm">Category</th>
                      <th className="sc-col-md">Last Updated</th>
                      <th className="sc-col-md">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaqs.map((f) => (
                      <tr key={f.id}>
                        <td className="sc-ellipsis">{f.question}</td>
                        <td>{f.category}</td>
                        <td>{f.lastUpdated}</td>
                        <td className="sc-actions">
                          <button
                            type="button"
                            onClick={() => handleViewFAQ(f.id)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this FAQ?"
                                )
                              ) {
                                handleDeleteFAQ(f.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredFaqs.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{ padding: 16, color: "#64748b" }}
                        >
                          No FAQ articles found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
