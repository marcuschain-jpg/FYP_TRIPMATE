import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Profile.css";
import "../styles/ItineraryFeed.css"; 

import FeedPic1 from "../Assets/FeedPic1.jpg";
import FeedPic2 from "../Assets/FeedPic2.jpg";

const BookmarkIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#333" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

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

//Dummy info
const allPosts = [
  { id: 1, username: "ChrisMartin123", avatarInitials: "CM", title: "10-Day Switzerland Itinerary", image: FeedPic1, text: "Planning to visit Switzerland soon? Here's the ultimate 10-day itinerary you need! From accommodations to transport, I've got you covered.", likes: 15, comments: 3, date: new Date("2025-01-20"), destination: "Switzerland" },
  { id: 2, username: "DomToretto", avatarInitials: "DT", title: "Thailand Group Trip", image: FeedPic2, text: "Had the most amazing time in Thailand with this bunch! Here's the itinerary we followed with some money-saving hacks.", likes: 25, comments: 2, date: new Date("2024-12-10"), destination: "Thailand" },
];

//Current user profile
const initialProfile = {
  username: "JohnSmith",
  bio: "Always down for an adventure!",
  accountType: "Premium",
  interests: {
    food: true,
    adventure: true,
    artMusic: false,
    history: false,
    sightseeing: false,
  },
  profilePic: "",
};

const getGlobalBookmarks = () => window.__TRIPMATE_BOOKMARKS__ || {};
const setGlobalBookmarks = (obj) => {
  window.__TRIPMATE_BOOKMARKS__ = obj;
  window.dispatchEvent(new CustomEvent("bookmarksUpdated", { detail: obj }));
};

function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(initialProfile);

  //Bookkmark state
  const [bookmarkedPosts, setBookmarkedPosts] = useState(() => getGlobalBookmarks());

  // ✅ Modal state
  const [activePost, setActivePost] = useState(null);

  //Syncing profile info--> when edits are made in EditProfilePage --> sync to ProfilePage
  useEffect(() => {
    if (location.state?.updatedProfile) {
      setProfile(location.state.updatedProfile);
      navigate("/profile", { replace: true });
    }
  }, [location.state, navigate]);

  //Listen for bookmark changes coming from Feed page ( when you bookark/unbookmark a post)
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail) setBookmarkedPosts(e.detail);
      else setBookmarkedPosts(getGlobalBookmarks());
    };
    window.addEventListener("bookmarksUpdated", handler);
    return () => window.removeEventListener("bookmarksUpdated", handler);
  }, []);

  const isPremium = profile.accountType === "Premium";

  const bookmarkedList = useMemo(() => {
    return allPosts.filter((p) => bookmarkedPosts[p.id]);
  }, [bookmarkedPosts]);

  const openPostModal = (post) => setActivePost(post);
  const closePostModal = () => setActivePost(null);

  const handleToggleBookmark = (id) => {
    const updated = { ...bookmarkedPosts, [id]: !bookmarkedPosts[id] };
    setBookmarkedPosts(updated);
    setGlobalBookmarks(updated);
    //Unbookmarking post 
    if (activePost?.id === id && updated[id] === false) setActivePost(null);
  };

  return (
    <div className="profile-page">
      <div className="profile-sidebar">
        <ul>
          <li onClick={() => navigate("/feed")}>Feed</li>
          <li className="active">My Profile</li>
        </ul>
      </div>

      <div className="profile-main">
        <div className="profile-header-container">
          <div className="profile-avatar-large">
            {profile.profilePic ? (
              <img src={profile.profilePic} alt="User Avatar" />
            ) : (
              <div className="avatar-placeholder-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-username-row">
              <h1>{profile.username}</h1>
              {isPremium && <span className="premium-badge">Premium</span>}
            </div>

            <p className="profile-bio">{profile.bio}</p>

            <div className="profile-actions">
              <button className="profile-btn edit-btn" onClick={() => navigate("/edit-profile", { state: { profile } })}>
                Edit Profile
              </button>
              <button className="profile-btn help-btn" onClick={() => navigate("/help")}>
                Help
              </button>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <div className="tab-item active">
            <BookmarkIcon active={true} />
          </div>
        </div>

        {/*Bookmarked posts grid*/}
        {bookmarkedList.length > 0 ? (
          <div className="profile-grid">
            {bookmarkedList.map((post) => (
              <div key={post.id} className="grid-item" onClick={() => openPostModal(post)}>
                <img src={post.image} alt={post.title} />
                <div className="grid-overlay">
                  <div className="bookmark-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0b4f6c" stroke="#0b4f6c" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-bookmarks">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>No bookmarked posts yet</p>
            <button className="browse-feed-btn" onClick={() => navigate("/feed")}>
              Browse Feed
            </button>
          </div>
        )}
      </div>

      {/*Expanded post modal--> when you click on a post to view*/}
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

export default ProfilePage;