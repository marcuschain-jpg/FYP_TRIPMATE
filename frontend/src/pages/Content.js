import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import "../styles/Content.css";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AddMarketingContent from "./AddMarketingContent";
import EditMarketingContent from "./EditMarketingContent";
import ViewUserReview from "./ViewUserReviewPage";

function parseDateTime(str) {
  // handles "YYYY-MM-DD HH:mm" and returns timestamp
  if (!str) return 0;
  const [d, t] = str.split(" ");
  if (!d || !t) return 0;
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0);
  return dt.getTime();
}

//Confirm Delete Pop-Up Function
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

export default function Content() {
  const [activeTab, setActiveTab] = useState("user-reviews"); // user-reviews | marketing
  const navigate = useNavigate(); //Navigate to Login Page

  //Fetching Data From Database
  const [reviewItems, setReviewItems] = useState([]);
  const [marketingItems, setMarketingItems] = useState([]);

  //Viewing Reviews
  const [reviewMode, setReviewMode] = useState("list"); // list | view
  const [currentReview, setCurrentReview] = useState(null);

  //Filtering System
  const [marketingFilter, setMarketingFilter] = useState("all"); // all | published | draft

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new"); // new | old | reports/rating/section

  // marketing sub-pages 
  const [marketingMode, setMarketingMode] = useState("list"); // list | add | edit
  const [editingMarketingId, setEditingMarketingId] = useState(null);

  //Confirm Delete Pop-Up
  const [modal, setModal] = useState(null);

  const searchPlaceholder =
    activeTab === "marketing" ? "Search by title/section" : "Search by review/user";

// Load Data From DB & Security Check
 useEffect(() => {
  const loadData = async () => {
    try {
      if (activeTab === "user-reviews") {
        const res = await axios.get(
          "http://localhost:8080/api/reviews",
          { withCredentials: true }
        );
        setReviewItems(res.data);
      }

      if (activeTab === "marketing") {
        const res = await axios.get(
          "http://localhost:8080/api/marketing",
          { withCredentials: true }
        );
        setMarketingItems(res.data);
      }

    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate(`/login/${err.response.status}: ${err.response.data?.message}`);
        return;
      }

      console.error("Load content failed:", err);
    }
  };

  loadData();
}, [activeTab, navigate]);

  //Capitalize Words in Status
  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // FILTERED (per tab)
  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviewItems.filter((item) =>
      !q ||
      item.review.toLowerCase().includes(q) ||
      item.user.toLowerCase().includes(q)
    );
  }, [reviewItems, searchQuery]);

  const filteredMarketing = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return marketingItems.filter((item) => {
      const matchesFilter =
        marketingFilter === "all" || item.status.toLowerCase() === marketingFilter;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [marketingItems, marketingFilter, searchQuery]);

  // SORTED (per tab) ✅ sort works for all three
  const sortedReviews = useMemo(() => {
    const arr = [...filteredReviews];
    const ratingToNum = (r) => {
      const n = parseFloat(String(r).split("/")[0]);
      return Number.isFinite(n) ? n : 0;
    };
    if (sortBy === "new") arr.sort((a, b) => parseDateTime(b.created) - parseDateTime(a.created));
    else if (sortBy === "old") arr.sort((a, b) => parseDateTime(a.created) - parseDateTime(b.created));
    else if (sortBy === "rating") arr.sort((a, b) => ratingToNum(b.rating) - ratingToNum(a.rating));
    return arr;
  }, [filteredReviews, sortBy]);

  const sortedMarketing = useMemo(() => {
    const arr = [...filteredMarketing];
    if (sortBy === "new") arr.sort((a, b) => parseDateTime(b.lastUpdated) - parseDateTime(a.lastUpdated));
    else if (sortBy === "old") arr.sort((a, b) => parseDateTime(a.lastUpdated) - parseDateTime(b.lastUpdated));
    else if (sortBy === "section") arr.sort((a, b) => String(a.section).localeCompare(String(b.section)));
    return arr;
  }, [filteredMarketing, sortBy]);

  // sort options change based on tab
  const sortOptions = useMemo(() => {
    if (activeTab === "user-reviews") {
      return [
        { value: "new", label: "New" },
        { value: "old", label: "Old" },
        { value: "rating", label: "Rating" },
      ];
    }
    return [
      { value: "new", label: "New" },
      { value: "old", label: "Old" },
      { value: "section", label: "Section" },
    ];
  }, [activeTab]);

  // actions
  // Delete Function
  
  //--User Review--
  const confirmDeleteReview = (review) => {
    setModal({
      title: "Delete Review",
      message: "Delete this review? This action cannot be undone.",
      action: async () => {
        try {
          await axios.delete(
            `http://localhost:8080/api/reviews/${review.id}`,
            { withCredentials: true }
          );

          setReviewItems((prev) =>
            prev.filter((r) => r.id !== review.id)
          );
        } catch (err) {
          console.error("User Review Fail to Delete.", err);
        } finally {
          setModal(null);
        }
      },
    });
  };

  //--Marketing Content--
  const confirmDeleteMarketing = (item) => {
    setModal({
      title: "Delete Marketing Content",
      message: "Delete this content? This action cannot be undone.",
      action: async () => {
        try {
          await axios.delete(
            `http://localhost:8080/api/marketing/${item.id}`,
            { withCredentials: true }
          );

          setMarketingItems((prev) =>
            prev.filter((m) => m.id !== item.id)
          );
        } catch (err) {
          console.error("Marketing Content Fail to Delete.", err);
        } finally {
          setModal(null);
        }
      },
    });
  };

  const handleView = (review) => {
    if (activeTab === "user-reviews") {
      setCurrentReview(review); // store entire object
      setReviewMode("view");
    }
  };

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Are you sure you want to delete this item?")) return;

  //   try {
  //     if (activeTab === "user-content") {
  //       await axios.delete(`http://localhost:8080/api/content/${id}`);
  //       setContentItems((prev) => prev.filter((x) => x.id !== id));
  //     }

  //     if (activeTab === "user-reviews") {
  //       await axios.delete(`http://localhost:8080/api/content/reviews/${id}`);
  //       setReviewItems((prev) => prev.filter((x) => x.id !== id));
  //     }

  //     if (activeTab === "marketing") {
  //       await axios.delete(`http://localhost:8080/api/content/marketing/${id}`);
  //       setMarketingItems((prev) => prev.filter((x) => x.id !== id));
  //     }
  //   } catch (err) {
  //     console.error("Delete failed", err);
  //   }
  // };

  // marketing add/edit handlers
  const openAddMarketing = () => {
    setMarketingMode("add");
    setEditingMarketingId(null);
  };

  const openEditMarketing = (id) => {
    setEditingMarketingId(id);
    setMarketingMode("edit");
  };

  const saveDraftMarketing = async (payload) => {
    try {
      const dataToSend = {
        section: payload.section,
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl || "", // backend expects URL, local file handled separately
        status: payload.status || "Draft",
      };

      let res;

      // UPDATE EXISTING
      if (payload.id) {
        res = await axios.put(
          `http://localhost:8080/api/marketing/${payload.id}`,
          dataToSend,
          { withCredentials: true }
        );

        // Replace the item in state with updated data
        setMarketingItems((prev) =>
          prev.map((m) => (m.id === payload.id ? res.data : m))
        );
      } 
      // CREATE NEW
      else {
        res = await axios.post(
          "http://localhost:8080/api/marketing",
          dataToSend,
          { withCredentials: true }
        );

        // Add new item at top of list
        setMarketingItems((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      console.error("Save marketing failed:", err);
      alert("Failed to save marketing content");
    }
  };

  const publishMarketing = (payload) => saveDraftMarketing({ ...payload, status: "Published" });

  const deleteMarketing = (id) => setMarketingItems((prev) => prev.filter((x) => x.id !== id));

  const reloadMarketing = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/marketing", { withCredentials: true });
      setMarketingItems(res.data);
    } catch (err) {
      console.error("Failed to reload marketing list", err);
    }
  };

  // If we're on marketing add/edit "pages", show them (like your FAQ flow)
  if (activeTab === "marketing" && marketingMode === "add") {
    return (
      <div className="cm-page">
        <div className="cm-header">
          <h1>Content Management</h1>
          <p>Manage user content and marketing page</p>
        </div>

        <AddMarketingContent
          onBack={() => setMarketingMode("list")}
          onSaveDraft={async (p) => {
          await saveDraftMarketing(p);
          await reloadMarketing();
          setMarketingMode("list");    
        }}

        onPublish={async (p) => {
          await publishMarketing(p);  
          await reloadMarketing();
          setMarketingMode("list");
        }}
                />
      </div>
    );
  }

  if (activeTab === "marketing" && marketingMode === "edit") {
    return (
      <div className="cm-page">
        <div className="cm-header">
          <h1>Content Management</h1>
          <p>Manage user content and marketing page</p>
        </div>

        <EditMarketingContent
          itemId={editingMarketingId}
          items={marketingItems}
          onBack={() => setMarketingMode("list")}
          onDelete={(id) => {
            deleteMarketing(id);
            setMarketingMode("list");
          }}
          onSaveDraft={(p) => {
            saveDraftMarketing(p);
            setMarketingMode("list");
          }}
          onPublish={(p) => {
            publishMarketing(p);
            setMarketingMode("list");
          }}
        />
      </div>
    );
  }
  
  //To View Reviews
  if (activeTab === "user-reviews" && reviewMode === "view") {
    return (
      <ViewUserReview
        review={currentReview} // pass full review object
        onBack={() => {
          setReviewMode("list");
          setCurrentReview(null);
        }}
      />
    );
  }

  return (
    <div className="cm-page">
      <div className="cm-header">
        <h1>Content Management</h1>
        <p>Manage user content and marketing page</p>
      </div>

      <div className="cm-card">
        {/* Tabs */}
        <div className="cm-tabs">
          <button
            type="button"
            className={`cm-tab ${activeTab === "user-reviews" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("user-reviews");
              setSortBy("new");
            }}
          >
            User Reviews
          </button>

          <button
            type="button"
            className={`cm-tab ${activeTab === "marketing" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("marketing");
              setSortBy("new");
              setMarketingMode("list");
            }}
          >
            Marketing
          </button>
        </div>

        <div className="cm-body">
          {/* TOOLBAR */}
          <div className="cm-toolbar">
            <div className="cm-toolbar-left">
              {activeTab === "marketing" && (
                <div className="cm-filter-tabs">
                  {["all", "published", "draft"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`cm-pill ${marketingFilter === f ? "is-on" : ""}`}
                      onClick={() => setMarketingFilter(f)}
                    >
                      {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              <span className="cm-label cm-sort-label">Sort by:</span>
              <select
                className="cm-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cm-toolbar-right">
              <div className="cm-search">
                <Search className="cm-search-icon" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                />
              </div>

              {activeTab === "marketing" && (
                <button type="button" className="cm-add" onClick={openAddMarketing}>
                  + Add New
                </button>
              )}
            </div>
          </div>

          {/* TABLES */}
          {activeTab === "user-reviews" && (
            <div className="cm-table-wrap">
              <table className="cm-table">
                <thead>
                  <tr>
                    <th className="cm-check"></th>
                    <th>ReviewID</th>
                    <th>Review</th>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReviews.map((item) => (
                    <tr key={item.id}>
                      <td className="cm-check">
                        <input type="checkbox" />
                      </td>
                      <td>{item.id}</td>
                      <td className="cm-ellipsis cm-review">{item.review}</td>
                      <td>{item.user}</td>
                      <td>{item.rating}</td>
                      <td>{capitalize(item.status)}</td>
                      <td>{item.created}</td>
                      <td className="cm-actions">
                        <button onClick={() => handleView(item)}>View</button>
                        <button onClick={() => confirmDeleteReview(item)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {sortedReviews.length === 0 && (
                    <tr>
                      <td colSpan={8} className="cm-empty">
                        No reviews found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "marketing" && (
            <div className="cm-table-wrap">
              <table className="cm-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMarketing.map((item) => (
                    <tr key={item.id}>
                      <td>{item.section}</td>
                      <td className="cm-ellipsis">{item.title}</td>
                      <td>{item.author}</td>
                      <td>{capitalize(item.status)}</td>
                      <td>{item.lastUpdated}</td>
                      <td className="cm-actions">
                        <button onClick={() => openEditMarketing(item.id)}>View</button>
                        <button onClick={() => confirmDeleteMarketing(item)}>Delete</button>
                      </td>
                    </tr>
                  ))}

                  {sortedMarketing.length === 0 && (
                    <tr>
                      <td colSpan={6} className="cm-empty">
                        No marketing content found.
                      </td>
                    </tr>
                  )}

                  {sortedMarketing.length > 0 &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`spacer-${i}`} className="cm-spacer">
                        <td colSpan={6}>&nbsp;</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          onConfirm={modal.action}
          onClose={() => setModal(null)}
        />
      )}

    </div>
  );
}
