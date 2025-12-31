import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ItineraryFeed.css";

//Import post images
import FeedPic1 from "../Assets/FeedPic1.jpg";
import FeedPic2 from "../Assets/FeedPic2.jpg";

//Icons bookmark post
const BookmarkHollow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const BookmarkFilled = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0b4f6c" stroke="#0b4f6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

//Dummy data
const dummyPosts = [
  { id: 1, username: "ChrisMartin123", avatarInitials: "CM", title: "10-Day Switzerland Itinerary", image: FeedPic1, text: "Planning to visit Switzerland soon? Here's the ultimate 10-day itinerary you need! From accommodations to transport, I've got you covered.", likes: 15, comments: 3, date: new Date("2025-01-20"), destination: "Switzerland" },
  { id: 2, username: "DomToretto", avatarInitials: "DT", title: "Thailand Group Trip", image: FeedPic2, text: "Had the most amazing time in Thailand with this bunch! Here's the itinerary we followed with some money-saving hacks.", likes: 25, comments: 2, date: new Date("2024-12-10"), destination: "Thailand" },
];

//Global bookmarks
const getGlobalBookmarks = () => window.__TRIPMATE_BOOKMARKS__ || {};
const setGlobalBookmarks = (obj) => {
  window.__TRIPMATE_BOOKMARKS__ = obj;
  window.dispatchEvent(new CustomEvent("bookmarksUpdated", { detail: obj }));
};

function ItineraryFeedPage() {
  const navigate = useNavigate();

  //Active post state
  const [activePost, setActivePost] = useState(null);
  //Sort state
  const [currentSort, setCurrentSort] = useState("Newest to Oldest");
  //Bookmarks state
  const [bookmarkedPosts, setBookmarkedPosts] = useState(() => getGlobalBookmarks());

  //Open post modal
  const openPostModal = (post) => setActivePost(post);
  //Close post modal
  const closePostModal = () => setActivePost(null);

  //Toggle bookmark
  const handleToggleBookmark = (id) => {
    setBookmarkedPosts((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      setGlobalBookmarks(updated);
      return updated;
    });
  };

  //Sort posts list (currently not working as content creators do not exist yet)
  const sortedPosts = [...dummyPosts].sort((a, b) => {
    switch (currentSort) {
      case "Oldest to Newest":
        return a.date - b.date;
      case "Newest to Oldest":
        return b.date - a.date;
      default:
        return 0;
    }
  });

  //Render post cards
  const renderPosts = () =>
    sortedPosts.map((post) => (
      <div className="feed-card" key={post.id} onClick={() => openPostModal(post)}>
        <div className="feed-image" style={{ backgroundImage: `url(${post.image})` }}>
          <div className="feed-card-title">{post.title}</div>
        </div>

        <div className="feed-content-wrapper">
          <div className="feed-user">
            <div className="user-avatar-placeholder">{post.avatarInitials}</div>
            <strong>{post.username}</strong>
          </div>

          <p className="feed-text">{post.text}</p>

          <div className="feed-actions">
            <div
              className={`action-group bookmark-group ${bookmarkedPosts[post.id] ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBookmark(post.id);
              }}
            >
              {bookmarkedPosts[post.id] ? <BookmarkFilled /> : <BookmarkHollow />}
            </div>
          </div>
        </div>
      </div>
    ));

  return (
    <div className="feed-page">
      <div className="feed-sidebar">
        <ul>
          <li className="active">Feed</li>
          <li onClick={() => navigate("/profile")}>My Profile</li>
        </ul>
      </div>

      <div className="feed-main">
        <div className="feed-cards">{renderPosts()}</div>
      </div>

      {/*Post details modal--> click on post to expand*/}
      {activePost && (
        <div className="post-modal-overlay" onClick={closePostModal}>
          <div className="post-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="post-modal-image" style={{ backgroundImage: `url(${activePost.image})` }} />

            <div className="post-modal-sidebar">
              <div className="post-sidebar-header">
                <div className="feed-user">
                  <div className="user-avatar-placeholder">{activePost.avatarInitials}</div>
                  <strong>{activePost.username}</strong>
                </div>
                <button className="modal-close-btn-sidebar" onClick={closePostModal}>
                  <CloseIcon />
                </button>
              </div>

              <div className="post-sidebar-body">
                <div className="post-caption-box">
                  <p>{activePost.text}</p>
                  <span className="post-date">{activePost.date.toDateString()}</span>
                </div>
                <hr className="divider" />
              </div>

              <div className="post-sidebar-footer">
                <div className="action-icons-row">
                  <div
                    className="action-group bookmark-group"
                    style={{ marginLeft: "auto", cursor: "pointer" }}
                    onClick={() => handleToggleBookmark(activePost.id)}
                  >
                    {bookmarkedPosts[activePost.id] ? <BookmarkFilled /> : <BookmarkHollow />}
                  </div>
                </div>
                <div className="likes-summary">
                  <strong>{activePost.likes} likes</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItineraryFeedPage;
