//First page all users will see when they enter tripmate.com
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";
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

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${landingImage})` }}
    >
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
    </div>
  );
}

export default Landing;
