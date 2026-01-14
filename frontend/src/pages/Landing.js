//Default page all users will see when they enter tripmate.com
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";
import Axios from '../hooks/Axios.js';

//Import images
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

  //Feature cards
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const LoadLanding = async() => {
      try{
        const res = await Axios.get("Landing/LoadLanding")
        console.log(res.data);
        setLoading(false);
        setFeatures(res.data.map(d => ({
          id: d.content_id,
          image: d.photo_url,
          title: d.c_title,
          description: d.c_content
        })));
      }
      catch(err){
        if(err.response) console.log(err.response.data.message);
        else console.log(err);
      }
    }
    LoadLanding();
  }, [])

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
          {!loading && features.map((feature, index) => (
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
          {loading && <p>Loading..</p>}
        </div>
      </section>
    </div>
  );
}

export default Landing;