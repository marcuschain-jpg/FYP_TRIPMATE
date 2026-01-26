import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Login.css";
import axios from "axios";
//Import background picture
import LoginBG from "../Assets/Login.jpg";
import { useTranslation } from "react-i18next"; 

export default function LoginPage({ setCurrentUserProfile, markAsFirstTimeUser }) {
  const navigate = useNavigate();
  const { errorMsg } = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [toast, setToast] = useState(null);
  const { t } = useTranslation();

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if(errorMsg) {
      showToast(errorMsg, "error");
      return;
    }
  }, []);

  const handleLogin = async() => {
    if (!email || !password || !role) {
      showToast(t("login_validate"), "error");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/AuthService/Login", {email, password, role}, {withCredentials:true});

      if(res.data.check === false) {
        showToast(res.data.message, "error");
        return;
      }
      else if(res.data.check === true) {
        const token = res.data.token;
        //Check if user has completed profile setup from backend
        const isFirstLogin = res.data.isFirstLogin || false;
        
        console.log("Login successful. isFirstLogin:", isFirstLogin);
        showToast(t("login_success"), "success");

        //Mark if this is first-time user
        markAsFirstTimeUser(isFirstLogin);

        //Redirect based on isFirstLogin flag
        if(role === "user") {
          setTimeout(() => {
            if (isFirstLogin) {
              navigate("/setup-profile");
            } else {
              navigate("/home");
            }
          }, 1200);
        }
        else if(role === "admin") {
          setTimeout(() => navigate("/admin/overview"), 1200);
        }
      }
    }
    catch (err) {
      console.error(err);
      showToast(t("login_failed"), "error");
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${LoginBG})` }}
    >
      {/*Toast message*/}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/*Slogan on the left*/}
      <div className="login-left">
        <h1 className="login-left-title">TripMate</h1>
        <p className="login-left-subtitle">
          {t("login_subtitle_1")} <br />
          {t("login_subtitle_2")}
        </p>
      </div>

      {/*Login card section --> contains login fields*/}
      <div className="login-card">
        <h2 className="login-title">{t("login_welcomeback")}</h2>
        <p className="login-subtitle">{t("login_afterwbmsg")}</p>

        {/*User role dropdown*/}
        <label className="login-label">{t("login_role")}</label>
        <select
          className="login-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">{t("login_role_select")}</option>
          <option value="user">{t("login_role_user")}</option>
          <option value="admin">{t("login_role_admin")}</option>
        </select>

        {/*Email field*/}
        <label className="login-label">{t("login_email_title")}</label>
        <input
          type="email"
          className="login-input"
          placeholder={t("enter_email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/*Password field*/}
        <label className="login-label">{t("login_password_title")}</label>
        <input
          type="password"
          className="login-input"
          placeholder={t("enter_password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/*Forgot password link*/}
        <p className="forgot-password-link">
          <span onClick={() => navigate("/reset-password")}>
            {t("login_forget_password_title")}
          </span>
        </p>

        {/*Login button*/}
        <button className="login-btn" onClick={handleLogin}>
          {t("login_login_title")}
        </button>

        {/*Takes user to create account page if they do not have an account*/}
        <p className="login-footer">
          {t("login_noacc")}{" "}
          <span
            className="login-link"
            onClick={() => navigate("/register")}
          >
            {t("login_createacc_title")}
          </span>
        </p>
      </div>
    </div>
  );
}