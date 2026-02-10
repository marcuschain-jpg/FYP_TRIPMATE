// src/pages/Support.js
import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import "../styles/Support.css";
import Axios from '../hooks/Axios'

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
  const [ticketSearch, setTicketSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1); //Limit Tickets Showing
  const ticketsPerPage = 6; 

  const [statusFilters, setStatusFilters] = useState({
    new: false,
    pending: false,
    resolved: false,
  });

  const [categoryFilters, setCategoryFilters] = useState({
    all: true,
    bugs: false,
    account: false,
    technical: false,
    others: false,
  });

  const categoryCaps = {
  bugs: "BUG",
  account: "ACCOUNT",
  technical: "TECHNICAL",
  others: "OTHERS"
};

  //FAQ UI State
  const [faqMode, setFaqMode] = useState("list");
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqSearch, setFaqSearch] = useState("");

  //Confirm Modal
  const [modal, setModal] = useState(null);

  const confirmAction = ({ title, message, onConfirm }) => {
    setModal({
      title,
      message,
      onConfirm,
    });
  };

  function ConfirmModal({ title, message, onConfirm, onClose }) {
    return (
      <div className="um-modal-backdrop">
        <div className="um-modal">
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="um-modal-actions">
            <button className="btn btn-danger" onClick={onConfirm}>
              Confirm
            </button>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  //---------------- Support Tickets --------------------
  //API Calls
  const fetchTickets = async () => {
    try {
      const res = await Axios.get(
        "/api/support",
        { withCredentials: true }
      );

      const normalized = res.data.map(t => ({
        id: t.ticketId,
        user: t.userEmail || "Unknown",
        userEmail: t.userEmail || "Unknown",
        title: t.title,
        status: t.status,
        category: t.category,
        created: t.createdAt,
        description: t.description, 
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
      const res = await Axios.get(
        `/api/support/${ticketId}/messages`,
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
      const res = await Axios.get(
        "/api/faq",
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

  useEffect(() => {
    setCurrentPage(1);
  }, [ticketSearch, statusFilters, categoryFilters]);

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

      // --- CATEGORY FILTER (refactored like status) ---
      const categoryKey = ticket.category?.toLowerCase(); // e.g., 'bugs', 'account'
      const matchesCategory = categoryFilters.all || categoryFilters[categoryKey];

      // --- SEARCH FILTER ---
      const matchesSearch =
        !q ||
        ticket.userEmail.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [tickets, ticketSearch, statusFilters, categoryFilters]);

  //Set Pages For Tickets
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * ticketsPerPage;
    const end = start + ticketsPerPage;
    return filteredTickets.slice(start, end);
  }, [filteredTickets, currentPage]);

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

  //Ticket Actions
  const sendTicketEmail = async (ticketId) => {
    try {
      await Axios.post(
        `/api/support/${ticketId}/send-email`,
        {}, // optional template info
        { withCredentials: true }
      );
      alert("Email sent to user!");
    } catch (err) {
      console.error("Failed to send email", err);
      alert("Failed to send email");
    }
  };

  const handleResolveTicket = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    confirmAction({
      title: "Resolve Ticket",
      message: `Are you sure you want to mark ticket #${ticket.id} as resolved?`,
      onConfirm: async () => {
        try {
          await Axios.patch(
            `/api/support/${ticket.id}`,
            { status: "RESOLVED" },
            { withCredentials: true }
          );

          setTickets(prev =>
            prev.map(t =>
              t.id === ticket.id ? { ...t, status: "RESOLVED" } : t
            )
          );

          setModal(null); // ✅ IMPORTANT: close modal
        } catch (err) {
          console.error("Failed to resolve ticket", err);
        }
      },
    });
  };

  //Filter Helpers
  const setCategory = (key, checked) => {
    if (key === "all") {
      setCategoryFilters({
        all: checked,
        bugs: false,
        account: false,
        technical: false,
        others: false,
      });
      return;
    }

    setCategoryFilters(prev => ({
      ...prev,
      all: false,
      [key]: checked,
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

  const handleDeleteFAQ = (faq) => {
    confirmAction({
      title: "Delete FAQ",
      message: `Are you sure you want to delete this FAQ? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await Axios.delete(`/api/faq/${faq.id}`, { withCredentials: true });
          setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
          setModal(null);
        } catch (err) {
          console.error("Failed to delete FAQ", err);
        }
      },
    });
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
        await Axios.patch(
          `api/faq/${payload.id}`,
          dbPayload,
          { withCredentials: true }
        );
      } else {
        await Axios.post(
          "api/faq",
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
        faq={faqs.find(f => f.id === editingFaqId)}
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
                  {["new", "pending", "resolved"].map((status) => (
                    <label className="sc-check" key={status}>
                      <input
                        type="checkbox"
                        checked={statusFilters[status]}
                        onChange={(e) =>
                          toggleStatus(status, e.target.checked)
                        }
                      />
                      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </label>
                  ))}
                </div>

                <div className="sc-filter-group">
                  <div className="sc-filter-title">Category</div>
                  {["all", "bugs", "account", "technical", "others"].map((cat) => (
                    <label className="sc-check" key={cat}>
                      <input
                        type="checkbox"
                        checked={categoryFilters[cat]}
                        onChange={(e) =>
                          setCategory(cat, e.target.checked)
                        }
                      />
                      <span>
                        {cat === "all"
                          ? "All"
                          : cat === "bugs"
                          ? "Bug Report"
                          : cat === "account"
                          ? "Account Issue"
                          : cat === "technical"
                          ? "Technical Support"
                          : "Others"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Middle */}
            <section className="sc-mid">
              <div className="sc-list">
                {paginatedTickets.map((t) => (
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
                        <span className="sc-ticket-hash">#{t.id}</span> {t.title}
                      </div>
                      <div className="sc-ticket-category">
                        {categoryCaps[t.category]}
                      </div>
                    </div>
                    <div className="sc-ticket-user">{t.user}</div>
                    <div className="sc-ticket-status">{t.status}</div>
                  </button>
                ))}

                {filteredTickets.length === 0 && (
                  <div className="sc-empty">No tickets found.</div>
                )}
              </div>

              {/* Pagination Bottom */}
              <div className="sc-pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`sc-page-btn ${
                      currentPage === i + 1 ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </section>

            {/* Right */}
            <section className="sc-right">
              {selectedTicket ? (
                <div className="sc-ticket-detail card">
                  <div className="ticket-header">
                    <h2>Ticket #{selectedTicket.id}</h2>
                    <span
                      className={`status-badge ${selectedTicket.status.toLowerCase()}`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>

                  <div className="ticket-meta">
                    <div>
                      <span className="label">User</span>
                      <span>{selectedTicket.userEmail}</span>
                    </div>
                    <div>
                      <span className="label">Category</span>
                      <span>{categoryCaps[selectedTicket.category]}</span>
                    </div>
                    <div>
                      <span className="label">Created</span>
                      <span>
                        {new Date(selectedTicket.created).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-block">
                    <span className="label">Title</span>
                    <p>{selectedTicket.title}</p>
                  </div>

                  <div className="ticket-block">
                    <span className="label">Description</span>
                    <p className="description">
                      {selectedTicket.description || "No description provided."}
                    </p>
                  </div>

                  <div className="sc-ticket-actions">
                    {selectedTicket.status !== "RESOLVED" && (
                      <>
                        <button
                          className="sc-btn sc-btn-primary"
                          onClick={() =>
                            sendTicketEmail(selectedTicket.id)
                          }
                        >
                          Send Email
                        </button>

                        <button
                          className="sc-btn sc-btn-success"
                          onClick={() =>
                            handleResolveTicket(selectedTicket.id)
                          }
                        >
                          Resolve Ticket
                        </button>
                      </>
                    )}
                  </div>
                </div>
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
                        <button type="button" onClick={() => handleViewFAQ(f.id)}>
                          View
                        </button>
                        <button type="button" onClick={() => handleDeleteFAQ(f)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredFaqs.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 16, color: "#64748b" }}>
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
    {modal && (
      <ConfirmModal
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={() => setModal(null)}
      />
    )}
  </div>
)};
