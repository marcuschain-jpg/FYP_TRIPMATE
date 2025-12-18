//First page all users will see when they enter tripmate.com
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

//Import background picture
import landingImage from "../Assets/Landing.jpg";

function Landing() {
  const navigate = useNavigate();

  //Redirect logged in users away from landing page
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/mytrips");
    }
  }, [navigate]);

  //Dummy reviews data 
  const reviews = [
    {
      name: "Ariana Grande",
      text: "TripMate helped me plan my Japan itinerary in minutes! It optimized all my routes and saved me so much time.",
      rating: 5,
    },
    {
      name: "Gordon Ramsay",
      text: "I love how my photos are automatically pinned to each location. The timeline feature made reliving my Bali trip special.",
      rating: 5,
    },
    {
      name: "Lee Min Ho",
      text: "While exploring, I asked a question about a temple and TripMate answered instantly. It’s like having a travel guide!",
      rating: 4,
    },
    {
      name: "Lin Jun Jie",
      text: "TripMate actually makes travel planning exciting. The interface is clean and the AI is smart.",
      rating: 5,
    },
    {
      name: "Jennie Kim",
      text: "I used to juggle multiple apps. TripMate simplified everything — planning and reflecting on trips feels effortless now.",
      rating: 5,
    },
  ];

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${landingImage})` }}
    >
      {/*Inner content wrapper to prevent skewing to one side*/}
      <div className="landing-content">
        <section className="hero-section">
          <h1 className="hero-title">Trip Planning just got SIMPLER</h1>
          <p className="hero-subtitle">
            Take a quiz and find out what type of traveller you are now!
          </p>

          {/*Button to bring users to take travel quiz*/}
          <button className="hero-btn" onClick={() => navigate("/quiz")}>
            Lets Go!
          </button>
        </section>

        {/*Reviews section (dummy data)*/}
        <section className="reviews-container">
          {reviews.map((review, index) => (
            <div className="review-card" key={index}>
              <div className="review-header">
                <div className="avatar">{review.name.charAt(0)}</div>
                <div>
                  <p className="review-name">{review.name}</p>
                  <p className="review-stars">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                </div>
              </div>
              <p className="review-text">{review.text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Landing;
