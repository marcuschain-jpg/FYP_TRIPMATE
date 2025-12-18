import React from "react";
import "../styles/ItineraryFeed.css";

function ItineraryFeedPage() {
  return (
    <div className="feed-page">
      {/* Left sidebar */}
      <div className="feed-sidebar">
        <ul>
          <li className="active">Feed</li>
          <li>My Profile</li>
        </ul>
      </div>

      {/* Main feed */}
      <div className="feed-main">
        <div className="feed-header">
          <input
            className="feed-search"
            placeholder="Search Destination or Username"
          />
          <button className="new-post-btn">New Post +</button>
        </div>

        {/* Feed cards */}
        <div className="feed-cards">
          {/* Card 1 */}
          <div className="feed-card">
            <div className="feed-user">
              <strong>ChrisMartin123</strong>
              <button className="follow-btn">Follow</button>
            </div>

            <div className="feed-image placeholder-img">
              10-Day Switzerland Itinerary
            </div>

            <div className="feed-actions">
              ❤️ 15 💬 3
            </div>

            <p className="feed-text">
              Planning to visit Switzerland soon? Here’s the ultimate 10-day
              itinerary you need! From accommodations to transport, I’ve got
              you covered.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feed-card">
            <div className="feed-user">
              <strong>DomToretto</strong>
              <button className="follow-btn">Follow</button>
            </div>

            <div className="feed-image placeholder-img">
              Thailand Group Trip
            </div>

            <div className="feed-actions">
              ❤️ 15 💬 3
            </div>

            <p className="feed-text">
              Had the most amazing time in Thailand with this bunch! Here’s the
              itinerary we followed with some money-saving hacks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItineraryFeedPage;
