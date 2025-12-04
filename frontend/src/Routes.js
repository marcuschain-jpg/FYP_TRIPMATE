import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

//Import pages
import ItineraryPlan from "./pages/ItineraryPlan";
import Landing from "./pages/Landing";

//React state
import React, { useState } from "react";

function AppRoutes() {
    
  //Profile dropdown box ("logout" & "MyProfile")
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
    
      <style>{`
        /*Navigation bar--> appear on all pages*/
        .main-navbar {
          width: 100%;
          height: 70px;
          background-color: #0b6fa4;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          position: sticky; /* sticks to top when scrolling */
          top: 0;
          z-index: 100; /* ensures it stays above page content */
        }

        /*Alignment of navvigation bar*/
        .nav-container {
          width: 90%;
          max-width: 1400px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo {
          font-size: 22px;
          font-weight: bold;
          color: white;
          text-decoration: none;
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 25px; /* spacing between nav links */
        }

        .nav-link {
          color: white;
          text-decoration: none;
          font-size: 16px;
        }

        .nav-link:hover {
          text-decoration: underline;
        }

        .join-btn {
          font-weight: bold;
          color: white;
        }

        /*User profile picture (top right corner)*/
        .nav-profile-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          cursor: pointer;
          border: 2px solid white;
        }

        /*Dropdown boz (logout & my proile*/
        .profile-menu {
          position: absolute;
          top: 75px;   /* slightly below navbar */
          right: 60px; /* aligned with navbar layout */
          background: white;
          color: black;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          width: 150px;
          overflow: hidden;
        }

        .profile-menu-item {
          padding: 12px 15px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .profile-menu-item:hover {
          background: #eeeeee;
        }
      `}</style>

      
      <BrowserRouter>
       
        <nav className="main-navbar">
          <div className="nav-container">

            <div className="nav-left">
              <Link to="/" className="nav-logo">TripMate.com</Link>
            </div>

            <div className="nav-center">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/ourstory" className="nav-link">Our Story</Link>
              <Link to="/mytrips" className="nav-link">My Trips</Link>
              <Link to="/feed" className="nav-link">Feed</Link>
              <Link to="/pricing" className="nav-link">Pricing</Link>
              <Link to="/join" className="nav-link join-btn">Join A Trip</Link>
            </div>

            <div className="nav-right">
              <img
                src="/profileicon.png"
                alt="profile"
                className="nav-profile-icon"
                onClick={() => setShowMenu((prev) => !prev)} 
              />

              {showMenu && (
                <div className="profile-menu">
                  <div className="profile-menu-item">Profile</div>
                  <div className="profile-menu-item">Logout</div>
                </div>
              )}
            </div>

          </div>
        </nav>

        {/*Routes linking*/}
        <Routes>
          {/*Route to home*/}
          <Route path="/" element={<Landing />} />

          {/*Route to "my trips" page*/}
          <Route path="/ItineraryPlanPage" element={<ItineraryPlan />} />

          {/*other pages (WIP)*/}
          <Route path="/ourstory" element={<Placeholder title="Our Story" />} />
          <Route path="/mytrips" element={<ItineraryPlan />} />
          <Route path="/feed" element={<Placeholder title="Feed" />} />
          <Route path="/pricing" element={<Placeholder title="Pricing" />} />
          <Route path="/join" element={<Placeholder title="Join A Trip" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

/*Placeholder for unfinished pages*/
function Placeholder({ title }) {
  return (
    <div style={{ padding: "40px" }}>
      <h1>{title}</h1>
      <p>This page will be created later.</p>
    </div>
  );
}

export default AppRoutes;
