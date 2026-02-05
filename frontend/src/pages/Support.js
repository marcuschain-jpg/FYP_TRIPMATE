// src/pages/Support.js
import React, { useEffect, useMemo, useState } from "react";
import { Search, Paperclip } from "lucide-react";
import "../styles/Support.css";
import axios from "axios";

// import {
//   mockTickets as initialTickets,
//   mockFAQs as initialFAQs,
// } from "../data/mockSupport";

import AddFAQArticle from "./AddFAQArticle";
import EditFAQArticle from "./EditFAQArticle";

export default function Support() {
  //Tabs
  const [activeTab, setActiveTab] = useState("tickets");

  //Data State
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);

  //Ticket UI State
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [attachments, setAttachments] = useState([]);
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

  //FAQ UI State
  const [faqMode, setFaqMode] = useState("list");
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqSearch, setFaqSearch] = useState("");

  //---------------- Support Tickets --------------------
  //API Calls
  const fetchTickets = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/support",
        { withCredentials: true }
      );

      const normalized = res.data.map(t => ({
        id: t.ticketId,
        user: t.userEmail || "Unknown",
        userEmail: t.userEmail || "Unknown",
        title: t.title,
        status: t.status,
        priority: t.priority,
        created: t.createdAt,
        messages: t.messages || []
      }));

      setTickets(normalized);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  //Messages For Ticket
  const fetchMessages = async (ticketId) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/support/${ticketId}/messages`,
        { withCredentials: true }
      );

      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? { ...t, messages: res.data }
            : t
        )
      );
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  //FAQs
  const fetchFaqs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/faq",
        { withCredentials: true }
      );

      const normalized = res.data.map(f => ({
        id: f.faqId,          
        question: f.question,  
        answer: f.answer,
        category: f.category,
        lastUpdated: f.lastUpdated
      }));

      setFaqs(normalized);
    } catch (err) {
      console.error("Failed to fetch FAQs", err);
    }
  };

  //Load Effects
  useEffect(() => {
    fetchTickets();
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  useEffect(() => {
    if (!selectedTicketId) return;
    fetchMessages(selectedTicketId);
  }, [selectedTicketId]);

  //Derived State
  const selectedTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim().toLowerCase();

    return tickets.filter(ticket => {
      const hasActiveStatus = Object.values(statusFilters).some(Boolean);
      const statusKey = ticket.status.toLowerCase();
      const matchesStatus = !hasActiveStatus || statusFilters[statusKey];

      const priorityKey = ticket.priority.toLowerCase();
      const matchesPriority =
        priorityFilters.all || priorityFilters[priorityKey];

      const matchesSearch =
        !q ||
        ticket.userEmail.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q);

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tickets, ticketSearch, statusFilters, priorityFilters]);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    if (!q) return faqs;

    return faqs.filter(f =>
      f.question.toLowerCase().includes(q) ||
      (f.category || "").toLowerCase().includes(q) ||
      (f.answer || "").toLowerCase().includes(q)
    );
  }, [faqs, faqSearch]);


  //Ticket Selection Function
  useEffect(() => {
    if (activeTab !== "tickets") return;
    if (!filteredTickets.length) return;

    const stillVisible =
      filteredTickets.some(t => t.id === selectedTicketId);

    if (!stillVisible) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [activeTab, filteredTickets, selectedTicketId]);

  //Update Helpers
  const updateTicket = async (patch) => {
    if (!selectedTicket) return;

    // Merge changes for UI immediately
    const updatedTicket = { ...selectedTicket, ...patch };
    setTickets(prev =>
      prev.map(t =>
        t.id === selectedTicket.id ? updatedTicket : t
      )
    );

    // Prepare payload for backend
    const statusToUpdate = patch.status || selectedTicket.status;
    const priorityToUpdate = patch.priority || selectedTicket.priority;

    try {
      await axios.patch(
        `http://localhost:8080/api/support/${selectedTicket.id}`,
        { status: statusToUpdate, priority: priorityToUpdate },
        { withCredentials: true }
      );

      // Ensure UI matches backend
      setTickets(prev =>
        prev.map(t =>
          t.id === selectedTicket.id
            ? { ...t, status: statusToUpdate, priority: priorityToUpdate }
            : t
        )
      );
    } catch (err) {
      console.error("Failed to update ticket:", err);

      // Revert UI to previous state if backend fails
      setTickets(prev =>
        prev.map(t =>
          t.id === selectedTicket.id ? selectedTicket : t
        )
      );
    }
  };

  //Ticket Actions
  const handleSendResponse = async () => {
    if (!selectedTicket) return;
    if (!responseText.trim() && attachments.length === 0) return;

    try {
      await axios.post(
        `http://localhost:8080/api/support/${selectedTicket.id}/message`,
        {
          content: responseText,
          attachments: attachments // array of { type, url, key }
        },
        { withCredentials: true }
      );

      // Update UI immediately
      // setTickets(prev =>
      //   prev.map(t =>
      //     t.id === selectedTicket.id
      //       ? {
      //           ...t,
      //           messages: [
      //             ...t.messages,
      //             {
      //               sender: "You",
      //               content: responseText,
      //               timestamp: new Date().toISOString(),
      //               attachments: payload.attachments
      //             }
      //           ]
      //         }
      //       : t
      //   )
      // );

      setResponseText("");
      setAttachments([]);
      fetchMessages(selectedTicket.id);

    } catch (err) {
      console.error("Send reply failed", err);
    }
  };

  const handleAttach = () => {
    if (!selectedTicket) return;

    // Create a temporary file input
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true; // allow multiple files
    input.accept = "image/*,video/*"; // restrict to images/videos

    input.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("media", files[i]);
      }

      try {
        const res = await axios.post(
          `http://localhost:8080/api/support/${selectedTicket.id}/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );

        // Update attachments state
        setAttachments(prev => [...prev, ...res.data]);

      } catch (err) {
        console.error("File upload failed", err);
      }
    };

    // Trigger file picker
    input.click();
  };

  const handleCancel = () => setResponseText("");

  //Filter Helpers
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

    setPriorityFilters(prev => ({
      ...prev,
      all: false,
      [key]: checked
    }));
  };

  const toggleStatus = (key, checked) => {
    setStatusFilters(prev => ({ ...prev, [key]: checked }));
  };

  //FAQ Actions
  const handleAddArticle = () => {
    setFaqMode("add");
    setEditingFaqId(null);
  };

  const handleViewFAQ = (id) => {
    setEditingFaqId(id);
    setFaqMode("edit");
  };

  const handleDeleteFAQ = async (id) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/faq/${id}`,
        { withCredentials: true }
      );
      fetchFaqs();
    } catch (err) {
      console.error("Delete FAQ failed", err);
    }
  };

  const handleSaveDraftFAQ = async (payload) => {
    try {
      // Map frontend keys to backend DB keys
      const dbPayload = {
        faq_category: payload.category,
        faq_question: payload.question,
        faq_answer: payload.answer,
      };

      if (payload.id) {
        await axios.patch(
          `http://localhost:8080/api/faq/${payload.id}`,
          dbPayload,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "http://localhost:8080/api/faq",
          dbPayload,
          { withCredentials: true }
        );
      }

      fetchFaqs();
    } catch (err) {
      console.error("Save FAQ failed", err);
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
          faq={faqs.find(f => f.id === editingFaqId)}  // pass the object directly
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
                            updateTicket({ status: e.target.value })
                          }
                        >
                            <option value="NEW">New</option>
                            <option value="OPEN">Open</option>
                            <option value="PENDING">Pending</option>
                            <option value="RESOLVED">Resolved</option>
                        </select>

                        <select
                          className="sc-select"
                          value={selectedTicket.priority}
                          onChange={(e) =>
                            updateTicket({ priority: e.target.value })
                          }
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="sc-messages">
                      {(selectedTicket.messages || []).length === 0 ? (
                        <div className="sc-empty-msg">No messages yet.</div>
                      ) : (
                        selectedTicket.messages.map((m, idx) => (
                          <div className="sc-message" key={idx}>
                            <div className="sc-message-head">
                              <span className="sc-message-sender">
                                {m.sender}
                              </span>
                              <span className="sc-message-time">
                                {m.created_at}
                              </span>
                            </div>
                            <div className="sc-message-bubble">
                              {m.content && <p>{m.content}</p>}
                            </div>
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
                    {filteredFaqs.map(f => (
                      <tr key={f.id}>
                        <td className="sc-ellipsis">{f.question}</td>
                        <td>{f.category}</td>
                        <td>{f.lastUpdated}</td>
                        <td className="sc-actions">
                          <button type="button" onClick={() => handleViewFAQ(f.id)}>View</button>
                          <button type="button" onClick={() => {
                            if(window.confirm("Are you sure you want to delete this FAQ?")) {
                              handleDeleteFAQ(f.id);
                            }
                          }}>Delete</button>
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
