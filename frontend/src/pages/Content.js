import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import "../styles/Content.css";

import {
  mockContent as initialContent,
  mockReviews as initialReviews,
  mockMarketing as initialMarketing,
} from "../data/mockContent";

import AddMarketingContent from "./AddMarketingContent";
import EditMarketingContent from "./EditMarketingContent";

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

export default function Content() {
  const [activeTab, setActiveTab] = useState("user-content"); // user-content | user-reviews | marketing

  // make data stateful (so edits/adds reflect immediately)
  const [contentItems, setContentItems] = useState(initialContent);
  const [reviewItems, setReviewItems] = useState(initialReviews);
  const [marketingItems, setMarketingItems] = useState(initialMarketing);

  const [contentFilter, setContentFilter] = useState("all"); // all | published | flagged
  const [reviewFilter, setReviewFilter] = useState("all"); // all | published | flagged
  const [marketingFilter, setMarketingFilter] = useState("all"); // all | published | draft

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new"); // new | old | reports/rating/section

  // marketing sub-pages (like you did for FAQ)
  const [marketingMode, setMarketingMode] = useState("list"); // list | add | edit
  const [editingMarketingId, setEditingMarketingId] = useState(null);

  const searchPlaceholder =
    activeTab === "marketing" ? "Search by title/section" : "Search by title/user";

  // FILTERED (per tab)
  const filteredContent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contentItems.filter((item) => {
      const matchesFilter =
        contentFilter === "all" || item.status.toLowerCase() === contentFilter;
      const matchesSearch =
        !q || item.title.toLowerCase().includes(q) || item.user.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [contentItems, contentFilter, searchQuery]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviewItems.filter((item) => {
      const matchesFilter =
        reviewFilter === "all" || item.status.toLowerCase() === reviewFilter;
      const matchesSearch =
        !q || item.review.toLowerCase().includes(q) || item.user.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [reviewItems, reviewFilter, searchQuery]);

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
  const sortedContent = useMemo(() => {
    const arr = [...filteredContent];
    if (sortBy === "new") arr.sort((a, b) => parseDateTime(b.created) - parseDateTime(a.created));
    else if (sortBy === "old") arr.sort((a, b) => parseDateTime(a.created) - parseDateTime(b.created));
    else if (sortBy === "reports") arr.sort((a, b) => (b.reports || 0) - (a.reports || 0));
    return arr;
  }, [filteredContent, sortBy]);

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
    if (activeTab === "user-content") {
      return [
        { value: "new", label: "New" },
        { value: "old", label: "Old" },
        { value: "reports", label: "Most Reports" },
      ];
    }
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
  const handleView = (id) => alert(`Viewing item ${id}`);
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    if (activeTab === "user-content") setContentItems((prev) => prev.filter((x) => x.id !== id));
    if (activeTab === "user-reviews") setReviewItems((prev) => prev.filter((x) => x.id !== id));
    if (activeTab === "marketing") setMarketingItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleFeature = (id) => alert(`Featured review ${id}`);

  // marketing add/edit handlers
  const openAddMarketing = () => {
    setMarketingMode("add");
    setEditingMarketingId(null);
  };

  const openEditMarketing = (id) => {
    setEditingMarketingId(id);
    setMarketingMode("edit");
  };

  const saveDraftMarketing = (payload) => {
    const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);

    if (payload.id) {
      setMarketingItems((prev) =>
        prev.map((m) =>
          m.id === payload.id
            ? {
                ...m,
                section: payload.section,
                title: payload.title,
                body: payload.body,
                imageUrl: payload.imageUrl,
                linkUrl: payload.linkUrl,
                status: payload.status || m.status,
                lastUpdated: stamp,
              }
            : m
        )
      );
    } else {
      const newId = `m${Date.now()}`;
      setMarketingItems((prev) => [
        {
          id: newId,
          section: payload.section,
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
          linkUrl: payload.linkUrl,
          author: "Admin01",
          status: payload.status || "Draft",
          lastUpdated: stamp,
        },
        ...prev,
      ]);
    }
  };

  const publishMarketing = (payload) => saveDraftMarketing({ ...payload, status: "Published" });

  const deleteMarketing = (id) => setMarketingItems((prev) => prev.filter((x) => x.id !== id));

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
            className={`cm-tab ${activeTab === "user-content" ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab("user-content");
              setSortBy("new");
            }}
          >
            User Content
          </button>

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
              <span className="cm-label">Filters:</span>

              {activeTab === "user-content" && (
                <div className="cm-filter-tabs">
                  {["all", "published", "flagged"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`cm-pill ${contentFilter === f ? "is-on" : ""}`}
                      onClick={() => setContentFilter(f)}
                    >
                      {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "user-reviews" && (
                <div className="cm-filter-tabs">
                  {["all", "published", "flagged"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`cm-pill ${reviewFilter === f ? "is-on" : ""}`}
                      onClick={() => setReviewFilter(f)}
                    >
                      {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              )}

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
          {activeTab === "user-content" && (
            <div className="cm-table-wrap">
              <table className="cm-table">
                <thead>
                  <tr>
                    <th className="cm-check"></th>
                    <th>ItineraryID</th>
                    <th>Title</th>
                    <th>User</th>
                    <th>Reports</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContent.map((item) => (
                    <tr key={item.id}>
                      <td className="cm-check">
                        <input type="checkbox" />
                      </td>
                      <td>{item.id}</td>
                      <td className="cm-ellipsis">{item.title}</td>
                      <td>{item.user}</td>
                      <td>{item.reports}</td>
                      <td>{item.status}</td>
                      <td>{item.created}</td>
                      <td className="cm-actions">
                        <button onClick={() => handleView(item.id)}>View</button>
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {sortedContent.length === 0 && (
                    <tr>
                      <td colSpan={8} className="cm-empty">
                        No content found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

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
                      <td>{item.status}</td>
                      <td>{item.created}</td>
                      <td className="cm-actions">
                        <button onClick={() => handleView(item.id)}>View</button>
                        <button onClick={() => handleFeature(item.id)}>Feature</button>
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
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
                      <td>{item.status}</td>
                      <td>{item.lastUpdated}</td>
                      <td className="cm-actions">
                        <button onClick={() => openEditMarketing(item.id)}>View</button>
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
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
    </div>
  );
}
