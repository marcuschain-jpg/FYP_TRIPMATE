import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Reviews.css";
import reviewsBg from "../Assets/Reviews.jpg";
import Axios from '../hooks/Axios.js';


function ReviewsPage() {
  //Render star rating based on number
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const LoadReviews = async() => {
      try{
        const res = await Axios.get(`Landing/LoadReviews`)
        setLoading(false);
        setReviews(res.data);
      }
      catch(err){
        if(err.response){
          if (err.response.status === 401 || err.response.status === 403) {
            const errorMsg = err.response.status + ": " + err.response.data.message;
            navigate(`/login/${errorMsg}`);
          } else if (err.response.status === 500) {
            const errorMsg = err.response.status + ": " + err.response.data.message;
            console.log(errorMsg);
          }
        }
        else console.log(err);
      }
    };
    LoadReviews();
  }, [])
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
            {loading && <p>Loading...</p>}
            {!loading && reviews.map((review) => (
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