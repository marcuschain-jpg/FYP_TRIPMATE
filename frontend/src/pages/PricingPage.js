import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Pricing.css";

//Import background picture
import PricingBG from "../Assets/Pricing.jpg";

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="pricing-bg"
      style={{ backgroundImage: `url(${PricingBG})` }}
    >
      <div className="pricing-wrapper">

        {/*Free version card */}
        <div className="pricing-card free">
          <h2 className="pricing-title">Free Version</h2>
          <p className="pricing-price">
            $0<span>/month</span>
          </p>

          <ul className="pricing-list">
            <li>1 time trial of AI trip planning</li>
            <li>Get inspiration from itineraries by other users</li>
            <li>Document your journey</li>
            <li>Create your own itineraries</li>
          </ul>

          <button
            className="pricing-btn"
            onClick={() => navigate("/register")} //Join button takes user to create account page
          >
            Join
          </button>
        </div>

        {/*premium version card*/}
        <div className="pricing-card premium">
          <h2 className="pricing-title">Premium Version</h2>
          <p className="pricing-price">
            $4.99<span>/month</span>
          </p>

          <ul className="pricing-list">
            <li>All free version functions</li>
            <li>Unlimited trip planning with AI</li>
            <li>Collaborate with friends & family</li>
            <li>Connect & join trips with other users</li>
            <li>Copy and edit itineraries from other users</li>
          </ul>

          <button
            className="pricing-btn"
            onClick={() => navigate("/register")} //Join button takes user to create account page 
          >
            Join
          </button>
        </div>

      </div>
    </div>
  );
}
