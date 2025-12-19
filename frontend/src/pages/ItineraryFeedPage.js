import React, { useState } from "react";
import "../styles/ItineraryFeed.css";

//Import post images
import FeedPic1 from "../Assets/FeedPic1.jpg";
import FeedPic2 from "../Assets/FeedPic2.jpg";

//icons --> like, bookmark, comment

const HeartHollow = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const HeartFilled = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff5a5f" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
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

const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const LargeImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="60" height="60" style={{ opacity: 0.7 }}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);


//dummy data 
const dummyPosts = [
  { id: 1, username: "ChrisMartin123", avatarInitials: "CM", title: "10-Day Switzerland Itinerary", image: FeedPic1, text: "Planning to visit Switzerland soon? Here’s the ultimate 10-day itinerary you need! From accommodations to transport, I’ve got you covered.", likes: 15, comments: 3, date: new Date('2025-01-20'), destination: 'Switzerland' },
  { id: 2, username: "DomToretto", avatarInitials: "DT", title: "Thailand Group Trip", image: FeedPic2, text: "Had the most amazing time in Thailand with this bunch! Here’s the itinerary we followed with some money-saving hacks.", likes: 25, comments: 2, date: new Date('2024-12-10'), destination: 'Thailand' },
];

//Initial comments data structure
const initialCommentsData = {
  1: [
    { id: 101, username: "JamesCharles", text: "WOW, looks amazing!", likes: 2, isLiked: false, isUser: false },
    { id: 102, username: "KendrickLamar", text: "I'm going next week! Appreciate the tips.", likes: 5, isLiked: true, isUser: false },
  ],
  2: [
    { id: 201, username: "Jisoo", text: "FIREEEEEE", likes: 10, isLiked: false, isUser: false },
    { id: 202, username: "JohnSmith", text: "so cool!", likes: 0, isLiked: false, isUser: true }, // 'isUser: true' allows editing/deleting
  ]
};

function ItineraryFeedPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  
  //Post & comment logic states
  const [activePost, setActivePost] = useState(null); // The post currently open in the modal
  const [commentsState, setCommentsState] = useState(initialCommentsData);
  const [newCommentText, setNewCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  
  //filter and search
  const [searchBy, setSearchBy] = useState('Username'); 
  const [currentSort, setCurrentSort] = useState('Newest to Oldest');
  const [searchTerm, setSearchTerm] = useState('');

  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});

  //handlers
  const toggleDropdown = () => setIsDropdownOpen(prev => !prev);
  const openCreatePostModal = () => setShowCreatePostModal(true);
  const closeCreatePostModal = () => setShowCreatePostModal(false);

  //Opens the detailed view
  const openPostModal = (post) => {
    setActivePost(post);
    setNewCommentText(""); // Reset input
    setEditingCommentId(null);
  };

  const closePostModal = () => {
    setActivePost(null);
  };

  //Add comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: Date.now(), //unique ID
      username: "MyUser", 
      text: newCommentText,
      likes: 0,
      isLiked: false,
      isUser: true //Mark as current users comment
    };

    setCommentsState(prev => ({
      ...prev,
      [activePost.id]: [...(prev[activePost.id] || []), newComment]
    }));
    setNewCommentText("");
  };

  //Delete comment
  const handleDeleteComment = (commentId) => {
    setCommentsState(prev => ({
      ...prev,
      [activePost.id]: prev[activePost.id].filter(c => c.id !== commentId)
    }));
  };

  //Start editing
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  //Save edit
  const handleSaveEdit = (commentId) => {
    setCommentsState(prev => ({
      ...prev,
      [activePost.id]: prev[activePost.id].map(c => 
        c.id === commentId ? { ...c, text: editCommentText } : c
      )
    }));
    setEditingCommentId(null);
    setEditCommentText("");
  };

  //Like comment
  const handleLikeComment = (commentId) => {
    setCommentsState(prev => ({
      ...prev,
      [activePost.id]: prev[activePost.id].map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !c.isLiked,
            likes: c.isLiked ? c.likes - 1 : c.likes + 1
          };
        }
        return c;
      })
    }));
  };

  const handleToggleLike = (id) => {
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleBookmark = (id) => {
    setBookmarkedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sortedPosts = [...dummyPosts].sort((a, b) => {
    switch (currentSort) {
      case 'Oldest to Newest': return a.date - b.date;
      case 'Newest to Oldest': return b.date - a.date;
      default: return 0; 
    }
  });

  const renderPosts = () => {
    return sortedPosts.map((post) => (
      <div className="feed-card" key={post.id}>
        <div className="feed-image" style={{ backgroundImage: `url(${post.image})` }}>
          <div className="feed-card-title">{post.title}</div>
        </div>

        <div className="feed-content-wrapper">
            <div className="feed-user">
              <div className="user-avatar-placeholder">{post.avatarInitials}</div>
              <strong>{post.username}</strong>
              <button className="follow-btn">Follow</button>
            </div>
            <p className="feed-text">{post.text}</p>
            
            <div className="feed-actions">
              <div className={`action-group like-group ${likedPosts[post.id] ? 'active' : ''}`} onClick={() => handleToggleLike(post.id)}>
                {likedPosts[post.id] ? <HeartFilled /> : <HeartHollow />}
                <span className="action-count">{post.likes}</span>
              </div>

              {/*Clicking this opens the detailed modal*/}
              <div className="action-group comment-group" onClick={() => openPostModal(post)}>
                <CommentIcon />
                <span className="action-count">
                  {commentsState[post.id] ? commentsState[post.id].length : post.comments}
                </span>
              </div>

              <div className={`action-group bookmark-group ${bookmarkedPosts[post.id] ? 'active' : ''}`} onClick={() => handleToggleBookmark(post.id)}>
                {bookmarkedPosts[post.id] ? <BookmarkFilled /> : <BookmarkHollow />}
              </div>
            </div>
        </div>
      </div>
    ));
  };


  return (
    <div className="feed-page">
      <div className="feed-sidebar">
        <ul>
          <li className="active">Feed</li>
          <li>My Profile</li>
        </ul>
      </div>

      <div className="feed-main">
        <div className="feed-header">
          <div className="feed-search-container">
            <input
              className="feed-search"
              placeholder="Search Destination or Username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="filter-icon-btn" onClick={toggleDropdown}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0b4f6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="filter-icon">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
            </button>
            
            <div className={`dropdown-content ${isDropdownOpen ? 'show' : ''}`}>
                <div className="dropdown-section">
                    <strong>Search By</strong>
                    <div className="radio-option">
                        <input type="radio" id="searchByUsername" name="searchBy" value="Username" checked={searchBy === 'Username'} onChange={() => setSearchBy('Username')} />
                        <label htmlFor="searchByUsername">Username</label>
                    </div>
                </div>
                <div className="dropdown-section">
                    <strong>Sort By</strong>
                    <div className="radio-option">
                        <input type="radio" id="sortByNewest" name="sortBy" value="Newest to Oldest" checked={currentSort === 'Newest to Oldest'} onChange={() => setCurrentSort('Newest to Oldest')} />
                        <label htmlFor="sortByNewest">Newest to Oldest</label>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="feed-cards">
          {renderPosts()}
        </div>
      </div>
      
      <button className="new-post-btn floating-action-btn" onClick={openCreatePostModal}>
        New Post +
      </button>
      
      {/* --- CREATE POST MODAL --- */}
      {showCreatePostModal && (
        <div className="modal-overlay" onClick={closeCreatePostModal}>
          <div className="create-post-modal-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-simple">
              <h2>Create New Post</h2>
              <button className="modal-close-btn" onClick={closeCreatePostModal}><CloseIcon /></button>
            </div>
            <div className="modal-content-simple">
                <LargeImageIcon />
                <button className="select-itinerary-btn">Select from Completed Itineraries</button>
            </div>
          </div>
        </div>
      )}

      {/*post details/comment modal*/}
      {activePost && (
        <div className="post-modal-overlay" onClick={closePostModal}>
            <div className="post-modal-container" onClick={(e) => e.stopPropagation()}>
                
                {/*left side image*/}
                <div className="post-modal-image" style={{ backgroundImage: `url(${activePost.image})` }}>
                </div>

                {/*post content and comments section*/}
                <div className="post-modal-sidebar">
                    {/*Header*/}
                    <div className="post-sidebar-header">
                        <div className="feed-user">
                            <div className="user-avatar-placeholder">{activePost.avatarInitials}</div>
                            <strong>{activePost.username}</strong>
                        </div>
                        <button className="modal-close-btn-sidebar" onClick={closePostModal}><CloseIcon /></button>
                    </div>

                    {/*Scrollable body*/}
                    <div className="post-sidebar-body">
                        {/*Original Caption*/}
                        <div className="post-caption-box">
                            <p>{activePost.text}</p>
                            <span className="post-date">{activePost.date.toDateString()}</span>
                        </div>

                        <hr className="divider" />

                        {/*Comments list*/}
                        <div className="comments-list">
                            {(commentsState[activePost.id] || []).map((comment) => (
                                <div className="comment-item" key={comment.id}>
                                    <div className="comment-avatar">{comment.username.charAt(0)}</div>
                                    <div className="comment-content">
                                        <div className="comment-bubble">
                                            <strong>{comment.username}</strong>
                                            
                                            {editingCommentId === comment.id ? (
                                                <div className="edit-input-wrapper">
                                                    <input 
                                                        className="edit-comment-input"
                                                        value={editCommentText}
                                                        onChange={(e) => setEditCommentText(e.target.value)}
                                                    />
                                                    <button onClick={() => handleSaveEdit(comment.id)} className="save-edit-btn">Save</button>
                                                </div>
                                            ) : (
                                                <p>{comment.text}</p>
                                            )}
                                        </div>

                                        <div className="comment-actions-bar">
                                            <span className="comment-time">2h</span>
                                            
                                            {/*Like button*/}
                                            <button 
                                                className={`comment-action-btn ${comment.isLiked ? 'liked' : ''}`}
                                                onClick={() => handleLikeComment(comment.id)}
                                            >
                                                {comment.isLiked ? 'Unlike' : 'Like'} ({comment.likes})
                                            </button>

                                            {/*User actions (edit/delete)*/}
                                            {comment.isUser && (
                                                <>
                                                    <button className="comment-action-btn" onClick={() => handleStartEdit(comment)}>
                                                        <EditIcon />
                                                    </button>
                                                    <button className="comment-action-btn delete" onClick={() => handleDeleteComment(comment.id)}>
                                                        <TrashIcon />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form className="post-sidebar-footer" onSubmit={handleAddComment}>
                        <div className="action-icons-row">
                             <div className={`action-group like-group ${likedPosts[activePost.id] ? 'active' : ''}`} onClick={() => handleToggleLike(activePost.id)}>
                                {likedPosts[activePost.id] ? <HeartFilled /> : <HeartHollow />}
                            </div>
                            <div className="action-group"><CommentIcon /></div>
                            <div className="action-group bookmark-group" style={{marginLeft: 'auto'}}>
                                {bookmarkedPosts[activePost.id] ? <BookmarkFilled /> : <BookmarkHollow />}
                            </div>
                        </div>
                        <div className="likes-summary">
                            <strong>{activePost.likes} likes</strong>
                        </div>
                        
                        <div className="add-comment-wrapper">
                            <input 
                                type="text" 
                                placeholder="Add a comment..." 
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                            />
                            <button type="submit" disabled={!newCommentText.trim()} className="post-btn">
                                Post
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
      
    </div>
  );
}

export default ItineraryFeedPage;