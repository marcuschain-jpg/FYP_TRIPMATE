import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Axios from '../hooks/Axios';
import "../styles/ResetPassword.css";
import Logo from "../Assets/Logo.jpg";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();

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
      showToast("Please enter your email address.", "error");
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
        showToast("Reset link sent to your email!", "success");
        setEmail("");
      } else {
        showToast(res.data.message || "Failed to send reset link.", "error");
        setFirstLoad(true);
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Error sending reset link.",
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
      showToast("Please fill in all fields.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
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
        showToast("Password reset successfully!", "success");
        setResetSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(res.data.message || "Failed to reset password.", "error");
        setFirstLoad(true);
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Error resetting password.",
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
          <p style={{ textAlign: "center", color: "#666", fontSize: "16px" }}>Validating reset link...</p>
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
            <h2 className="reset-title">Forgot Password?</h2>
            <p className="reset-subtitle">
              Enter your email and we'll send you a link to reset your password
            </p>

            <label className="reset-label">Email Address</label>
            <input
              type="email"
              className="reset-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!firstload}
            />

            <button 
              className="reset-btn" 
              onClick={handleSendReset}
              disabled={!firstload || loading}
            >
              {firstload && !loading && "Send Reset Link"}
              {loading && "Sending..."}
              {!firstload && !loading && "✓ Sent"}
            </button>

            <p className="reset-footer">
              Remember your password?{" "}
              <span
                className="reset-link"
                onClick={() => navigate("/login")}
              >
                Back to Login
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
            <h2 className="reset-title">Reset Your Password</h2>
            <p className="reset-subtitle">
              Enter your new password below
            </p>

            <label className="reset-label">New Password</label>
            <input
              type="password"
              className="reset-input"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!firstload}
            />

            <label className="reset-label">Confirm Password</label>
            <input
              type="password"
              className="reset-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!firstload}
            />

            <button 
              className="reset-btn" 
              onClick={handleResetPassword}
              disabled={!firstload || loading}
            >
              {firstload && !loading && "Save New Password"}
              {loading && "Saving..."}
              {!firstload && !loading && "Password Reset"}
            </button>

            <p className="reset-footer">
              <span
                className="reset-link"
                onClick={() => navigate("/login")}
              >
                Back to Login
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
            <h2 className="reset-title">Password Reset Complete!</h2>
            <p className="reset-subtitle">
              Your password has been successfully reset. You can now log in with your new password.
            </p>

            <button 
              className="reset-btn" 
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}