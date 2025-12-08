import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";   
import "../styles/Home.css";

import HomeMainPhoto from "../Assets/HomeMainPhoto.jpg";
import HomeSmall1 from "../Assets/HomeSmall1.jpg";
import HomeSmall2 from "../Assets/HomeSmall2.jpg";

export default function HomePage() {
  const navigate = useNavigate();  

  const [username, setUsername] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user) {
      setUsername(
        user.name ||
        user.fullName ||
        user.username ||
        user.firstName ||
        user.email
      );
    }
  }, []);

  return (
    <div className="home-container">

      {/*Banner on top of page*/}
      <div className="home-banner">
        <img src={HomeMainPhoto} alt="Main" className="home-banner-img" />
        <h1 className="home-banner-text">Welcome Back,<br />{username}</h1>
      </div>

      {/*2 Cards*/}
      <div className="home-cards">

        {/*Browse feed card*/}
        <div className="home-card">
          <img src={HomeSmall1} className="home-card-img" />
          <h2 className="home-card-title">Browse Feed</h2>
          <p className="home-card-desc">
            Browse itineraries from fellow travellers and discover unique experiences.
          </p>
          <button className="home-card-btn" onClick={() => navigate("/feed")}>
            View
          </button>
        </div>

        {/*My trips card*/}
        <div className="home-card">
          <img src={HomeSmall2} className="home-card-img" />
          <h2 className="home-card-title">My Trips</h2>
          <p className="home-card-desc">
            Looking for a getaway from all the hustle and bustle? Plan your next trip now!
          </p>
          <button className="home-card-btn" onClick={() => navigate("/mytrips")}>
            View
          </button>
        </div>

      </div>
    </div>
  );
}
