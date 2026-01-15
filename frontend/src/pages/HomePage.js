import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";   
import "../styles/Home.css";
import axios from 'axios';
import HomeMainPhoto from "../Assets/HomeMainPhoto.jpg";
import HomeSmall1 from "../Assets/HomeSmall1.jpg";
import HomeSmall2 from "../Assets/HomeSmall2.jpg";

export default function HomePage() {
  const navigate = useNavigate();  
  const [role, setRole] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    /*await axios.post("http://localhost:8080/AuthCheck", {}, {withCredentials: true})
        .then(res => {
          setRole(res.data.role);
        });*/
    axios.get("http://localhost:8080/Landing/GetHome", {withCredentials: true})
      .then(res => {
        setName(res.data[0].first_name);
      })
      .catch(err => {
        if(err.response.status === 401 || 403){
          const errData = err.response;
          const errorMsg = errData.status + ": " + errData.data.message;
          navigate(`/login/${errorMsg}`);
        }
      });
  }, []);

  return (
    <div className="home-container">
      {/*Banner on top of page*/}
      <div className="home-banner">
        <img src={HomeMainPhoto} alt="Main" className="home-banner-img" />
        <h1 className="home-banner-text">Welcome Back,<br />{name}</h1>
      </div>

      {/*2 Cards*/}
      <div className="home-cards">
        {/*My calendar card--> brings user to profile page*/}
        <div className="home-card">
          <img src={HomeSmall1} className="home-card-img" alt=""/>
          <h2 className="home-card-title">My Calendar</h2>
          <p className="home-card-desc">
            View your upcoming trips and events all in one place. Stay organized and never miss a moment!
          </p>
          <button className="home-card-btn" onClick={() => navigate("/profile")}>
            View
          </button>
        </div>

        {/*My trips card*/}
        <div className="home-card">
          <img src={HomeSmall2} className="home-card-img" alt="" />
          <h2 className="home-card-title">My Trips</h2>
          <p className="home-card-desc">
            Looking for a getaway from all the hustle and bustle? Plan your next trip now!
          </p>
          <button className="home-card-btn" onClick={() => navigate("/mytrips")}>
            View
          </button>
        </div>
      </div>

      {/*Floating Chatbot Button*/}
      <button
        className="chatbot-fab"
        onClick={() => navigate("/chatbot")}
        aria-label="Open Chatbot"
      >
        🤖
      </button>
    </div>
  );
}