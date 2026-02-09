import { Outlet, Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Axios from "../hooks/Axios.js";
import { useTranslation } from "react-i18next";

function UserNavbar({ outletContext }) {
    const [showMenu, setShowMenu] = useState(false);
    const [defaultLang, setDefaultLang] = useState("English");
    const navigate = useNavigate();
    
    //use effect load user pref lang
    useEffect(() => {
        const loadLang = async() => {
            try{
                const res = await Axios.get("Navbar/LoadUsernav", {withCredentials:true});
                changeLanguage(res.data);
                setDefaultLang(res.data);
            }
            catch(err){
                if(err.response){
                    if(err.response.status === 401 || err.response.status === 403){
                        const errorMsg = err.response.status + ": " + err.response.data?.message;
                        navigate(`/login/${errorMsg}`);
                    }
                    else if(err.response.status === 500) console.log(err.response.data.message);
                }
                else console.log(err);
            }
        }
        loadLang();
    }, [])
    
    //handle logout functionality
    const handleLogout = async () => {
        localStorage.removeItem("user");
        await Axios
            .post(
                "AuthService/Logout",
                {},
                { withCredentials: true }
            )
            .then((res) => {
                if (res.data.success) alert(t("Successfully Logged Out"));
            })
            .catch((err) => console.error(err));

        navigate("/"); //send user to landing page (marketing page)
    };

    const { i18n } = useTranslation();
    const { t } = useTranslation();
    
    //change language functionality
    const changeLanguage = async(lng) => {
        try{
            const res = await Axios.patch("Navbar/ChangeLang", {lng}, {withCredentials:true});
            if(res.data) i18n.changeLanguage(lng);
        }
        catch(err){
            if(err.response){
                if(err.response.status === 401 || err.response.status === 403){
                    const errorMsg = err.response.status + ": " + err.response.data?.message;
                    navigate(`/login/${errorMsg}`);
                }
                else if(err.response.status === 500) console.log(err.response.data.message);
            }
            else console.log(err);
        }
    };

    return (
        <>
            {/*Styling for registered user navbar --> shows up when user is logged in*/}
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
                    flex: 1;
                    justify-content: center;
                }

                .nav-link {
                    color: white;
                    text-decoration: none;
                    font-size: 16px;
                }

                .nav-link:hover {
                    text-decoration: underline;
                }

                .hamburger-menu {
                    width: 36px;
                    height: 36px;
                    background: transparent;
                    border: 2px solid white;
                    border-radius: 5px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    gap: 5px;
                    padding: 0;
                    transition: background 0.2s ease;
                }

                .hamburger-menu:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .hamburger-line {
                    width: 20px;
                    height: 2px;
                    background: white;
                    border-radius: 1px;
                }

                .profile-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    color: black;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    width: 150px;
                    overflow: hidden;
                    z-index: 1000;
                    margin-top: 5px;
                }

                .profile-menu-item {
                    padding: 12px 15px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    font-size: 14px;
                }

                .profile-menu-item:hover {
                    background: #eeeeee;
                }

                .nav-right {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    position: relative;
                }

                .locale-selector {
                    background: transparent;
                    color: white;
                    border: 1px solid white;
                    border-radius: 5px;
                    padding: 5px 8px;
                    font-size: 14px;
                    cursor: pointer;
                    height: 36px;
                    display: flex;
                    align-items: center;
                }

                .locale-selector option {
                    color: black;
                }
            `}</style>

            <nav className="main-navbar">
                <div className="nav-container">
                    <div className="nav-left">
                        <Link to="/mytrips" className="nav-logo">
                            TripMate.com
                        </Link>
                    </div>

                    <div className="nav-center">
                        <Link to="/home" className="nav-link">
                            {t("reg_nav_home")}
                        </Link>
                        <Link to="/mytrips" className="nav-link">
                            {t("reg_nav_mytrips")}
                        </Link>
                        <Link to="/join-trip" className="nav-link">
                            {t("reg_nav_joinatrip")}
                        </Link>
                        <Link to="/profile" className="nav-link">
                            {t("reg_nav_myprofile")}
                        </Link>
                    </div>

                    <div className="nav-right">
                        <select className="locale-selector" value={i18n.language} onChange={(e) => changeLanguage(e.target.value)}>
                            <option value="en">English</option>
                            <option value="zh">中文</option>
                            <option value="ja">日本語</option>
                            <option value="ar">عربي</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                        </select>
                        <button
                            className="hamburger-menu"
                            onClick={() => setShowMenu((prev) => !prev)}
                            aria-label="Menu"
                        >
                            <div className="hamburger-line"></div>
                            <div className="hamburger-line"></div>
                            <div className="hamburger-line"></div>
                        </button>

                        {showMenu && (
                            <div className="profile-menu">
                                <button
                                    className="profile-menu-item"
                                    onClick={handleLogout}
                                >
                                    {t("reg_nav_logout")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            <Outlet context={outletContext} />
        </>
    );
}

export default UserNavbar;