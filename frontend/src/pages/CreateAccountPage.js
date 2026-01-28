import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreateAccount.css";
import Axios from '../hooks/Axios';
import { useTranslation } from "react-i18next";

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  //Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [toast, setToast] = useState(null); // message + type

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleRegister = async() => {
    if (!email || !password || !firstName || !lastName) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    if(password.length < 8){
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }

    await Axios.post("AuthService/CreateAccount", {email:email, password:password, firstname:firstName, lastname:lastName})
    .then(res=>{
      if(res.data === true)
      {
        showToast("🎉 Account created successfully!", "success");
        setTimeout(() => {navigate("/login");}, 2000);
      }
      else{
        showToast("❌ This email is already registered!", "error");
        return;
      }
    });
  };

  return (
    <div className="register-bg">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="register-card">
        <img
          src={require("../Assets/TripMateLogo.jpg")}
          alt="TripMate Logo"
          className="register-logo"
        />

        <h2 className="register-title">{t("cacc_title")}</h2>

        <div className="register-form">
          <label>{t("cacc_email")}</label>
          <input
            type="email"
            placeholder={t("cacc_email_ph")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>{t("cacc_password")}</label>
          <input
            type="password"
            placeholder={t("cacc_password_ph")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="name-row">
            <div>
              <label>{t("cacc_firstname")}</label>
              <input
                type="text"
                placeholder={t("cacc_firstname")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label>{t("cacc_lastname")}</label>
              <input
                type="text"
                placeholder={t("cacc_lastname")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <button className="register-btn" onClick={handleRegister}>
            {t("cacc_register")}
          </button>
        </div>

        <p className="register-login-text">
            {t("cacc_acc_exist")}{" "}
            <span 
                className="create-login-link"
                onClick={() => navigate("/login")}
            >
                {t("cacc_login")}
            </span>
        </p>

      </div>
    </div>
  );
}
