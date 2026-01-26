import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/ConfirmationFromEmail.css";
import logo from "../Assets/Logo.jpg";
import axios from 'axios';
import { useTranslation } from "react-i18next";

function ConfirmationFromEmail() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [invalidMsg, setInvalidMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const { invID } = useParams();
  const { t } = useTranslation("confirmation");

  const acceptCollab = async () => {
    try {
      const res = await axios.post("http://localhost:8080/Itinerary/AcceptCollabInv", {
        inv_id: invID
      });
      console.log(res);
      
      if (res.data === true) {
        setLoading(false);
        setSuccess(true);
      } else if (res.data.check === false) {
        setLoading(false);
        setInvalid(true);
        setInvalidMsg(res.data.message);
      }
    } catch (err) {
      setLoading(false);
      setInvalid(true);
      if (err.response?.status === 500) {
        setInvalidMsg(err.response.data.message);
      } else {
        setInvalidMsg("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="confirmation-container">
      <div className={`confirmation-card ${invalid ? 'error-state' : ''} ${success ? 'success-state' : ''}`}>
        
        {loading && !invalid && (
          <>
            <img src={logo} alt="TripMate Logo" className="confirmation-logo" />
            <h1 className="confirmation-title">{t("cp_confirm_title")}</h1>
            <p className="confirmation-subtitle">
              {t("cp_confirm_text")}
            </p>
            <button className="confirmation-button" onClick={acceptCollab}>
              {t("cp_accept_btn")}
            </button>
          </>
        )}

        {invalid && (
          <>
            <span className="confirmation-icon">❌</span>
            <h1 className="confirmation-title">{t("cp_invalid_title")}</h1>
            <div className="error-message">{invalidMsg}</div>
            <button 
              className="confirmation-button" 
              onClick={() => navigate('/login')}
            >
              {t("cp_login_btn")}
            </button>
          </>
        )}

        {success && !invalid && (
          <>
            <span className="confirmation-icon success-checkmark">✓</span>
            <h1 className="confirmation-title">{t("cp_accept_title")}</h1>
            <p className="confirmation-subtitle">
              {t("cp_accept_text")}
            </p>
            <button 
              className="confirmation-button" 
              onClick={() => navigate('/login')}
            >
              {t("cp_accept_login_btn")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ConfirmationFromEmail;