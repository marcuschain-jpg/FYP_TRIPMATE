import { Link, Outlet } from "react-router-dom";
import React from "react";

function UnregisteredUserNavBar() {
    return (
        <>
            {/*Styling for unregistered user navbar*/}
            <style>{`
                .unreg-navbar { 
                    width: 100%;
                    height: 70px;
                    background-color: transparent; 
                    position: absolute;
                    top: 0;
                    left: 0;
                    display: flex;
                    justify-content: center;
                    z-index: 50;
                }

                .unreg-nav-container {
                    width: 90%;
                    max-width: 1400px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 10px;
                }

                .unreg-logo {
                    font-size: 22px;
                    font-weight: bold;
                    color: white;
                    text-decoration: none;
                }

                .unreg-links {
                    display: flex;
                    gap: 25px;
                    align-items: center;
                }

                .unreg-link {
                    color: white;
                    text-decoration: none;
                    font-size: 16px;
                }

                .unreg-link:hover {
                    text-decoration: underline;
                }
            `}</style>

            <nav className="unreg-navbar">
                <div className="unreg-nav-container">

                    <Link to="/" className="unreg-logo">TripMate</Link>

                    <div className="unreg-links">
                        <Link to="/pricing" className="unreg-link">Pricing</Link>
                        <Link to="/login" className="unreg-link">Login</Link>
                        <Link to="/register" className="unreg-link">Create Account</Link>
                    </div>

                </div>
            </nav>

            <Outlet />
        </>
    );
}

export default UnregisteredUserNavBar;
