import { Link, Outlet } from "react-router-dom";
import React from "react";
import { useTranslation } from "react-i18next";

function UnregisteredUserNavBar() {
    const { i18n } = useTranslation();
    const { t } = useTranslation();
    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

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
                .locale-selector {
                    background: transparent;
                    color: white;
                    border: 1px solid white;
                    border-radius: 5px;
                    padding: 3px 6px;
                    font-size: 14px;
                    cursor: pointer;
                }
            `}</style>

            <nav className="unreg-navbar">
                <div className="unreg-nav-container">

                    <Link to="/" className="unreg-logo">TripMate</Link>

                    <div className="unreg-links">
                        <Link to="/pricing" className="unreg-link">{t("unreg_nav_pricing")}</Link>
                        <Link to="/reviews" className="unreg-link">{t("unreg_nav_reviews")}</Link>
                        <Link to="/login" className="unreg-link">{t("unreg_nav_login")}</Link>
                        <Link to="/register" className="unreg-link">{t("unreg_nav_cacc")}</Link>

                    <select className="locale-selector" value={i18n.language} onChange={(e) => changeLanguage(e.target.value)}>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                        <option value="ar">عربي</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                    </select>
                    </div>
                </div>
            </nav>

            <Outlet />
        </>
    );
}

export default UnregisteredUserNavBar;