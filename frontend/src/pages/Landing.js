//Default page all users will see when they enter tripmate.com
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";
import Axios from '../hooks/Axios.js';
import { useTranslation } from "react-i18next";

//Import images
import landingImage from "../Assets/Landing.jpg";
import reviewsBg from "../Assets/Reviews.jpg";

function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  //Redirect logged in users away from landing page
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/mytrips");
    }
  }, [navigate]);

  //Feature cards
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(i18n.language||"en");
  const [video, setVideo] = useState("");

  //Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if(!lang || !loading) return;
    const LoadLanding = async() => {
      try{
        const res = await Axios.get("Landing/LoadLanding", {params:{lang}})
        console.log(res.data[3].vid_url);
        setLoading(false);
        setFeatures(res.data.map(d => ({
          id: d.content_id,
          image: d.photo_url,
          title: d.c_title,
          description: d.c_content
        })));
        setVideo(res.data[3].vid_url);
      }
      catch(err){
        if(err.response) console.log(err.response.data.message);
        else console.log(err);
      }
    }
    LoadLanding();
  }, [lang])

  //Load reviews - runs on initial load and when language changes
  useEffect(() => {
    if(!lang || !reviewsLoading) return;
    
    const LoadReviews = async() => {
      try{
        const res = await Axios.get("Landing/LoadReviews", {params:{lang}});
        console.log("Reviews loaded:", res.data);
        setReviewsLoading(false);
        setReviews(res.data);
      }
      catch(err){
        console.log("Error loading reviews:", err);
        setReviewsLoading(false);
        if(err.response){
          console.log(err.response.data.message);
        }
        else console.log(err);
      }
    };
    LoadReviews();
  }, [lang]);

  //Reload reviews with updated text based on language
  useEffect(() => {
    if(lang && !reviewsLoading && reviews.length > 0){
      const LoadReviews = async() => {
        try{
          const idNums = reviews.map(i => ({
            id: i.id
          }));
          const cidNums = JSON.stringify(idNums);
          const res = await Axios.get("Landing/ReloadReviews", {params:{lang, idNums:cidNums}});
          console.log("Reviews reloaded:", res.data);
          res.data.map(item => {
            setReviews(prev => prev.map(i => i.id === item.review_id ? {
              ...i,
              text: item.text,
            }: i));
          });
        }
        catch(err){
          console.log("Error reloading reviews:", err);
          if(err.response) console.log(err.response.data.message);
          else console.log(err);
        }
      };
      LoadReviews();
    }
  }, [lang]);

  useEffect(() => {
    //Run when ititialized(default) & lang changed
    i18n.on("languageChanged", function(lng) {
      setLang(lng);
    });

    return() => {
      i18n.off("languageChanged", function(lng) {});
    };
  }, [i18n])

  useEffect(() => {
    if(lang && !loading){
      const LoadLanding = async() => {
        try{
          const idNums = features.map(i => ({
            id: i.id
          }));
          const cidNums = JSON.stringify(idNums);
          const res = await Axios.get("Landing/ReloadLanding", {params:{lang, idNums:cidNums}})
          console.log(res.data);
          res.data.map(item => {
            setFeatures(prev => prev.map(i => i.id === item.content_id ? {
              ...i,
              title: item.title,
              description: item.description,
            }: i))
          })
        }
        catch(err){
          if(err.response) console.log(err.response.data.message);
          else console.log(err);
        }
      }
    LoadLanding();
    }
  }, [lang])

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
    <div className="landing-container">
      <section 
        className="hero-section"
        style={{ backgroundImage: `url(${landingImage})` }}
      >
        <div className="hero-overlay">
          <h1 className="hero-title">{t("landing_title")}</h1>
          
          {/*Temporary placeholder for marketing vid*/}
          <div className="video-placeholder">
            <video src={video} autoPlay loop muted playsinline controls style={{ width: '100%', height: '100%' }}></video>
            {/*<div className="play-button">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="2"/>
                <path d="M24 20L40 30L24 40V20Z" fill="currentColor"/>
              </svg>
            </div>*/}
          </div>
        </div>
      </section>

      {/*Tripmate features*/}
      <section className="features-section">
        <div className="features-container">
          {!loading && features.slice(0, 3).map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-image-wrapper">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="feature-image"
                />
              </div>
              <div className="feature-text">
                <h3 className="feature-title">{t("feature_title", {feature_title: feature.title})}</h3>
                <p className="feature-description">{t("feature_description", {feature_desc: feature.description})}</p>
              </div>
            </div>
          ))}
          {loading && <p>Loading..</p>}
        </div>
      </section>

      {/*Reviews Section*/}
      <section className="reviews-section-landing" style={{ backgroundImage: `url(${reviewsBg})` }}>
        <div className="reviews-overlay-landing">
          <div className="reviews-container-landing">
          <h2 className="reviews-section-title-landing">Customer Reviews</h2>
          <div className="reviews-grid-landing">
            {reviewsLoading && <p className="reviews-loading-landing">Loading reviews...</p>}
            {reviews.length === 0 && !reviewsLoading && <p className="reviews-empty-landing">No reviews available.</p>}
            {!reviewsLoading && reviews.slice(0, 6).map((review) => (
              <div key={review.id} className="review-card-landing">
                {/*Review header with user profile picture and user info*/}
                <div className="review-header-landing">
                  <div className="review-avatar-landing">
                    {review.name.charAt(0)}
                  </div>
                  <div className="review-info-landing">
                    <div className="review-name-row-landing">
                      <span className="review-name-landing">{review.name}</span>
                      {review.isPremium && <span className="premium-badge-landing">Premium</span>}
                    </div>
                    {renderStars(review.rating)}
                    <span className="review-time-landing">{review.timeAgo}</span>
                  </div>
                </div>
                {/*Review text content*/}
                <p className="review-text-landing">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;