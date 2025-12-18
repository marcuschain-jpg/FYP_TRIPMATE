import React, { useState } from "react";
import "../styles/ItineraryFeed.css";

//Import post images
import FeedPic1 from "../Assets/FeedPic1.jpg";
import FeedPic2 from "../Assets/FeedPic2.jpg";

//Actions
//Hollow Heart pic
const HeartHollow = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

//Filled Heart pic --> after liking post
const HeartFilled = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff5a5f" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

//Hollow Bookmark pic
const BookmarkHollow = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
);

//Filled Bookmark pic
const BookmarkFilled = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0b4f6c" stroke="#0b4f6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
);

//Comment Icon 
const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);


const dummyPosts = [
  { id: 1, username: "ChrisMartin123", avatarInitials: "CM", title: "10-Day Switzerland Itinerary", image: FeedPic1, text: "Planning to visit Switzerland soon? Here’s the ultimate 10-day itinerary you need! From accommodations to transport, I’ve got you covered.", likes: 15, comments: 3, date: new Date('2025-01-20'), destination: 'Switzerland' },
  { id: 2, username: "DomToretto", avatarInitials: "DT", title: "Thailand Group Trip", image: FeedPic2, text: "Had the most amazing time in Thailand with this bunch! Here’s the itinerary we followed with some money-saving hacks.", likes: 15, comments: 3, date: new Date('2024-12-10'), destination: 'Thailand' },
];

function ItineraryFeedPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  //Filter options and search input
  const [searchBy, setSearchBy] = useState('Username'); // Default search filter
  const [currentSort, setCurrentSort] = useState('Newest to Oldest');
  const [searchTerm, setSearchTerm] = useState('');

  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const handleSortChange = (sortType) => {
    setCurrentSort(sortType);
    setIsDropdownOpen(false); 
  };

  const handleSearchByChange = (byType) => {
    setSearchBy(byType);
  };

  const handleToggleLike = (id) => {
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleBookmark = (id) => {
    setBookmarkedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };


  //Filtering Logic 
  const sortedPosts = [...dummyPosts].sort((a, b) => {
    switch (currentSort) {
      case 'Oldest to Newest':
        return a.date - b.date;
      case 'Newest to Oldest':
        return b.date - a.date;
      default:
        return 0; 
    }
  });


  const renderPosts = () => {
    return sortedPosts.map((post) => (
      <div className="feed-card" key={post.id}>
        
        <div
          className="feed-image"
          style={{ backgroundImage: `url(${post.image})` }}
        >
          <div className="feed-card-title">
            {post.title}
          </div>
        </div>

        <div className="feed-content-wrapper">
            <div className="feed-user">
              <div className="user-avatar-placeholder">{post.avatarInitials}</div>
              <strong>{post.username}</strong>
              <button className="follow-btn">Follow</button>
            </div>

            <p className="feed-text">
              {post.text}
            </p>
            
            <div className="feed-actions">
              
              <div className={`action-group like-group ${likedPosts[post.id] ? 'active' : ''}`} onClick={() => handleToggleLike(post.id)}>
                {likedPosts[post.id] ? <HeartFilled /> : <HeartHollow />}
                <span className="action-count">{post.likes}</span>
              </div>

              <div className="action-group comment-group">
                <CommentIcon />
                <span className="action-count">{post.comments}</span>
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
          
          {/*Search bar with filter*/}
          <div className="feed-search-container">
            <input
              className="feed-search"
              placeholder="Search Destination or Username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/*Filter icon button*/}
            <button className="filter-icon-btn" onClick={toggleDropdown}>
              {/*Filter Icon*/}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0b4f6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="filter-icon">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
            </button>
            
            {/*Search by drop down structure added with Figma radio buttons*/}
            <div className={`dropdown-content ${isDropdownOpen ? 'show' : ''}`}>
                
                {/*Search by section*/}
                <div className="dropdown-section">
                    <strong>Search By</strong>
                    <div className="radio-option">
                        <input 
                            type="radio" 
                            id="searchByUsername" 
                            name="searchBy" 
                            value="Username" 
                            checked={searchBy === 'Username'} 
                            onChange={() => handleSearchByChange('Username')} 
                        />
                        <label htmlFor="searchByUsername">Username</label>
                    </div>
                    <div className="radio-option">
                        <input 
                            type="radio" 
                            id="searchByDescription" 
                            name="searchBy" 
                            value="Description" 
                            checked={searchBy === 'Description'} 
                            onChange={() => handleSearchByChange('Description')} 
                        />
                        <label htmlFor="searchByDescription">Description</label>
                    </div>
                </div>

                {/*Sort by section*/}
                <div className="dropdown-section">
                    <strong>Sort By</strong>
                    <div className="radio-option">
                        <input 
                            type="radio" 
                            id="sortByNewest" 
                            name="sortBy" 
                            value="Newest to Oldest" 
                            checked={currentSort === 'Newest to Oldest'} 
                            onChange={() => handleSortChange('Newest to Oldest')} 
                        />
                        <label htmlFor="sortByNewest">Newest to Oldest</label>
                    </div>
                    <div className="radio-option">
                        <input 
                            type="radio" 
                            id="sortByOldest" 
                            name="sortBy" 
                            value="Oldest to Newest" 
                            checked={currentSort === 'Oldest to Newest'} 
                            onChange={() => handleSortChange('Oldest to Newest')} 
                        />
                        <label htmlFor="sortByOldest">Oldest to Newest</label>
                    </div>
                </div>
            </div>
          </div>
          
          <button className="new-post-btn">New Post +</button>
        </div>

        <div className="feed-cards">
          {renderPosts()}
        </div>
      </div>
    </div>
  );
}

export default ItineraryFeedPage;