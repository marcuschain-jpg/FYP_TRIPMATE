import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/ConfirmationFromEmail.css";
import logo from "../Assets/Logo.jpg";
import axios from 'axios';

function ConfirmationFromEmail() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [invalidMsg, setInvalidMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const { invID } = useParams();

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
            <h1 className="confirmation-title">You've Been Invited!</h1>
            <p className="confirmation-subtitle">
              Your friends have invited you to collaborate on their trip
            </p>
            <button className="confirmation-button" onClick={acceptCollab}>
              Accept Invitation
            </button>
          </>
        )}

        {invalid && (
          <>
            <span className="confirmation-icon">❌</span>
            <h1 className="confirmation-title">Invitation Invalid</h1>
            <div className="error-message">{invalidMsg}</div>
            <button 
              className="confirmation-button" 
              onClick={() => navigate('/login')}
            >
              Go Back to Login
            </button>
          </>
        )}

        {success && !invalid && (
          <>
            <span className="confirmation-icon success-checkmark">✓</span>
            <h1 className="confirmation-title">Invitation Accepted!</h1>
            <p className="confirmation-subtitle">
              Great! You're all set. Log in to start planning your trip together.
            </p>
            <button 
              className="confirmation-button" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ConfirmationFromEmail;