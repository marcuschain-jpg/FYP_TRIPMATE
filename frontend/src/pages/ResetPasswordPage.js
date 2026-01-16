import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/ResetPassword.css";
import Logo from "../Assets/Logo.jpg";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();

  //States for enter email or reset passwrod 
  const [step, setStep] = useState(token ? "reset-password" : "enter-email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

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
        const res = await axios.post(
          "http://localhost:8080/AuthService/ValidateResetToken",
          { token },
          { withCredentials: true }
        );

        if (res.data.check === true) {
          setTokenValid(true);
          setStep("reset-password");
        } else {
          showToast("Reset link has expired. Please try again.", "error");
          setTimeout(() => navigate("/reset-password"), 2000);
        }
      } catch (err) {
        console.error(err);
        showToast("Invalid or expired reset link.", "error");
        setTimeout(() => navigate("/reset-password"), 2000);
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

    try {
      const res = await axios.post(
        "http://localhost:8080/AuthService/ForgotPassword",
        { email },
        { withCredentials: true }
      );

      if (res.data.check === true) {
        showToast("Reset link sent to your email!", "success");
        setEmail("");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        showToast(res.data.message || "Failed to send reset link.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Error sending reset link.",
        "error"
      );
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

    try {
      const res = await axios.post(
        "http://localhost:8080/AuthService/ResetPassword",
        { token, newPassword },
        { withCredentials: true }
      );

      if (res.data.check === true) {
        showToast("Password reset successfully!", "success");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        showToast(res.data.message || "Failed to reset password.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Error resetting password.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  //Debug logging
  useEffect(() => {
    console.log("ResetPasswordPage mounted");
    console.log("Token:", token);
    console.log("Step:", step);
    console.log("isValidating:", isValidating);
    console.log("tokenValid:", tokenValid);
  }, [token, step, isValidating, tokenValid]);

  if (isValidating && token) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <p>Validating reset link...</p>
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
            />

            <button 
              className="reset-btn" 
              onClick={handleSendReset}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
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

        {step === "reset-password" && tokenValid && (
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
            />

            <label className="reset-label">Confirm Password</label>
            <input
              type="password"
              className="reset-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button 
              className="reset-btn" 
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save New Password"}
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

        {!step && (
          <div style={{ color: "red" }}>
            <p>Error: Step not set. Token: {token}</p>
          </div>
        )}
      </div>
    </div>
  );
}