import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Axios from '../hooks/Axios';
import "../styles/ResetPassword.css";
import Logo from "../Assets/Logo.jpg";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { t } = useTranslation("confirmation");

  //States for enter email or reset password
  const [step, setStep] = useState(token ? "reset-password" : "enter-email");
  
  // Force reset-password step if token exists in URL
  useEffect(() => {
    if (token) {
      setStep("reset-password");
    }
  }, [token]);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstload, setFirstLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [isValidating, setIsValidating] = useState(token ? true : false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  //Validate token on page load 
  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await Axios.post(
          "AuthService/ValidateToken",
          { token },
          { withCredentials: false }
        );

        if (res.data === true) {
          setTokenValid(true);
        }
        else {
          setTokenValid(false);
          setIsValidating(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  //Send password reset link to user after entering email
  const handleSendReset = async () => {
    if (!email) {
      showToast(t("rp_err_email"), "error");
      return;
    }

    setLoading(true);
    setFirstLoad(false);

    try {
      const res = await Axios.post(
        "AuthService/SendResetEmail",
        { email },
        { withCredentials: false }
      );

      if (res.data === true) {
        showToast(t("rp_succ_email"), "success");
        setEmail("");
      } else {
        showToast(t("rp_err_sendemail"), "error");
        setFirstLoad(true);
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || t("rp_err_sendemail_gen"),
        "error"
      );
      setFirstLoad(true);
    } finally {
      setLoading(false);
    }
  };

  //Use link to reset password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast(t("rp_err_pw_fields"), "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t("rp_err_pw_match"), "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast(t("rp_err_pw_length"), "error");
      return;
    }

    setLoading(true);
    setFirstLoad(false);

    try {
      const res = await Axios.patch(
        "AuthService/ResetPassword",
        { token, newPassword },
        { withCredentials: false }
      );

      if (res.data === true) {
        showToast(t("rp_succ_send_pw"), "success");
        setResetSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(t("rp_err_send_pw"), "error");
        setFirstLoad(true);
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || t("rp_err_send_pw_gen"),
        "error"
      );
      setFirstLoad(true);
    } finally {
      setLoading(false);
    }
  };

  if (isValidating && token) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <p style={{ textAlign: "center", color: "#666", fontSize: "16px" }}>{t("rp_validating")}</p>
        </div>
      </div>
    );
  }

  if (!isValidating && !tokenValid) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <p style={{ textAlign: "center", color: "#666", fontSize: "16px" }}>{t("rp_err_validating")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div className="reset-card">
        {/*Enter email to get link*/}
        {step === "enter-email" && (
          <>
            <div className="reset-logo">
              <img src={Logo} alt="Logo" />
            </div>
            <h2 className="reset-title">{t("rp_forgetpassword_title")}</h2>
            <p className="reset-subtitle">
              {t("rp_forgetpassword_text")}
            </p>

            <label className="reset-label">{t("rp_enteremail_tb")}</label>
            <input
              type="email"
              className="reset-input"
              placeholder={t("rp_enteremail_ph")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!firstload}
            />

            <button 
              className="reset-btn" 
              onClick={handleSendReset}
              disabled={!firstload || loading}
            >
              {firstload && !loading && t("rp_send_btn")}
              {loading && t("rp_sending_btn")}
              {!firstload && !loading && `✓ ${t("rp_sent_btn")}`}
            </button>

            <p className="reset-footer">
              {t("rp_rmbpw_title")}{" "}
              <span
                className="reset-link"
                onClick={() => navigate("/login")}
              >
                {t("rp_login_btn")}
              </span>
            </p>
          </>
        )}

        {/*Reset password*/}
        {step === "reset-password" && !resetSuccess && (
          <>
            <div className="reset-logo">
              <img src={Logo} alt="Logo" />
            </div>
            <h2 className="reset-title">{t("rp_resetpassword_title")}</h2>
            <p className="reset-subtitle">
              {t("rp_resetpassword_text")}
            </p>

            <label className="reset-label">{t("rp_password_tb")}</label>
            <input
              type="password"
              className="reset-input"
              placeholder={t("rp_password_ph")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!firstload}
            />

            <label className="reset-label">{t("rp_confirmpassword_tb")}</label>
            <input
              type="password"
              className="reset-input"
              placeholder={t("rp_confirmpassword_ph")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!firstload}
            />

            <button 
              className="reset-btn" 
              onClick={handleResetPassword}
              disabled={!firstload || loading}
            >
              {firstload && !loading && t("rp_save_btn")}
              {loading && t("rp_saving_btn")}
              {!firstload && !loading && t("rp_reset_btn")}
            </button>

            <p className="reset-footer">
              <span
                className="reset-link"
                onClick={() => navigate("/login")}
              >
                {t("rp_login_btn")}
              </span>
            </p>
          </>
        )}

        {/*Display success message when password successfully reset*/}
        {step === "reset-password" && resetSuccess && (
          <>
            <div className="reset-logo">
              <img src={Logo} alt="Logo" />
            </div>
            <h2 className="reset-title">{t("rp_complete_title")}</h2>
            <p className="reset-subtitle">
              {t("rp_complete_text")}
            </p>

            <button 
              className="reset-btn" 
              onClick={() => navigate("/login")}
            >
              {t("rp_login_btn")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}