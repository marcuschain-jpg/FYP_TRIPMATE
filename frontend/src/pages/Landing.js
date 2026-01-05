//Default page all users will see when they enter tripmate.com
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

//Import images
import landingImage from "../Assets/Landing.jpg";
import marketing1 from "../Assets/Marketing1.jpg";
import marketing2 from "../Assets/Marketing2.jpg";
import marketing3 from "../Assets/Marketing3.jpg";

function Landing() {
  const navigate = useNavigate();

  //Redirect logged in users away from landing page
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/mytrips");
    }
  }, [navigate]);

  //Feature cards--> dummy data and pics
  const features = [
    {
      image: marketing1,
      title: "Integrated Chatbot",
      description: "Integrated chatbot function to for Q&A as well as optimized trip planning"
    },
    {
      image: marketing2,
      title: "Integrated Chatbot",
      description: "Integrated chatbot function to for Q&A as well as optimized trip planning"
    },
    {
      image: marketing3,
      title: "Integrated Chatbot",
      description: "Integrated chatbot function to for Q&A as well as optimized trip planning"
    }
  ];

  return (
    <div className="landing-container">
      <section 
        className="hero-section"
        style={{ backgroundImage: `url(${landingImage})` }}
      >
        <div className="hero-overlay">
          <h1 className="hero-title">Trip Planning just got SIMPLER</h1>
          
          {/*Temporary placeholder for marketing vid*/}
          <div className="video-placeholder">
            <div className="play-button">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="2"/>
                <path d="M24 20L40 30L24 40V20Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/*Tripmate features*/}
      <section className="features-section">
        <div className="features-container">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-image-wrapper">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="feature-image"
                />
              </div>
              <div className="feature-text">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Landing;