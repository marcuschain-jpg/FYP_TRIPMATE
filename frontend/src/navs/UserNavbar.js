import { Outlet, Link, useNavigate, useParams } from "react-router-dom";
import React, { useState } from "react";


function UserNavbar() {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/"); //send user to landing page (marketing page)
    };

    return (
        <>
            {/*Styling for registered user navbar--> shows up when user is logged in*/}
            <style>{`
                .main-navbar {
                    width: 100%;
                    height: 70px;
                    background-color: #0b6fa4;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

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
                    gap: 25px;
                }

                .nav-link {
                    color: white;
                    text-decoration: none;
                    font-size: 16px;
                }

                .nav-link:hover {
                    text-decoration: underline;
                }

                .nav-profile-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    object-fit: cover;
                    cursor: pointer;
                    border: 2px solid white;
                }

                .profile-menu {
                    position: absolute;
                    top: 75px;
                    right: 60px;
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

            <nav className="main-navbar">
                <div className="nav-container">

                    <div className="nav-left">
                        <Link to="/mytrips" className="nav-logo">TripMate.com</Link>
                    </div>

                    <div className="nav-center">
                        <Link to='/home' className="nav-link">Home</Link>
                        <Link to='/mytrips' className="nav-link">My Trips</Link>
                        <Link to="/feed" className="nav-link">Feed</Link>
                        <Link to="/join" className="nav-link">Join A Trip</Link>
                        
                        
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
                                <div
                                    className="profile-menu-item"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </nav>

            <Outlet />
        </>
    );
}

export default UserNavbar;
