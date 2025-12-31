import React from "react";
import "../styles/Reviews.css";
import reviewsBg from "../Assets/Reviews.jpg";

//Dummy reviews data
const reviews = [
  {
    id: 1,
    name: "Ariana Grande",
    rating: 5,
    timeAgo: "3 months ago",
    text: "TripMate helped me plan my Japan itinerary in minutes! It optimized all my routes and saved me so much time. Super intuitive and stress-free.",
    isPremium: true
  },
  {
    id: 2,
    name: "Lin Jun Jie",
    rating: 5,
    timeAgo: "1 month ago",
    text: "TripMate actually makes travel planning exciting. The interface is clean, the AI is smart, and it feels built for travelers like me.",
    isPremium: true
  },
  {
    id: 3,
    name: "Tom Holland",
    rating: 5,
    timeAgo: "2 weeks ago",
    text: "I'm so impressed! I love how personalized this website is. I usually have a tough time thinking about activities to do but now with suggestions from the website, planning my trips is such a breeze!",
    isPremium: true
  },
  {
    id: 4,
    name: "Lee Min Ho",
    rating: 4,
    timeAgo: "3 hours ago",
    text: "While exploring, I asked a question about a temple — and TripMate answered instantly! It's like having a smart guide in your pocket.",
    isPremium: false
  },
  {
    id: 5,
    name: "Jennie Kim",
    rating: 4,
    timeAgo: "2 days ago",
    text: "I used to juggle multiple apps for trip planning, but TripMate simplified everything. Planning and reflecting on my trips feels effortless now.",
    isPremium: false
  },
  {
    id: 6,
    name: "Gordan Ramsay",
    rating: 5,
    timeAgo: "1 day ago",
    text: "I love how my photos are automatically pinned to each location. The timeline feature made reliving my Bali trip so special!",
    isPremium: false
  }
];

function ReviewsPage() {
  //Render star rating based on number
  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? "star-filled" : "star-empty"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="reviews-page" style={{ backgroundImage: `url(${reviewsBg})` }}>
      <div className="reviews-overlay">
        <div className="reviews-container">
          <div className="reviews-grid">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                {/*Review header with user profile picture and user info*/}
                <div className="review-header">
                  <div className="review-avatar">
                    {review.name.charAt(0)}
                  </div>
                  <div className="review-info">
                    <div className="review-name-row">
                      <span className="review-name">{review.name}</span>
                      {review.isPremium && <span className="premium-badge-small">Premium</span>}
                    </div>
                    {renderStars(review.rating)}
                    <span className="review-time">{review.timeAgo}</span>
                  </div>
                </div>
                {/*Review text content*/}
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewsPage;