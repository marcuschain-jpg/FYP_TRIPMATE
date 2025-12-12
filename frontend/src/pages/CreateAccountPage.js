import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreateAccount.css";

export default function CreateAccountPage() {
  const navigate = useNavigate();

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

  const handleRegister = () => {
    if (!email || !password || !firstName || !lastName) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    //Get existing accounts
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    //Check for duplicate email--> show error message if account already exists
    const exists = users.some((u) => u.email === email);

    if (exists) {
      showToast("❌ This email is already registered!", "error");
      return;
    }

    //Save new user and create account
    // 🔥 ADD UNIQUE USER ID HERE
    const newUser = { 
      id: Date.now(),  // ← UNIQUE ID FOR THIS USER
      email, 
      password, 
      firstName, 
      lastName 
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    showToast("🎉 Account created successfully!", "success");

    setTimeout(() => {
      navigate("/login");
    }, 2000);
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

        <h2 className="register-title">Create An Account</h2>

        <div className="register-form">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="name-row">
            <div>
              <label>First Name</label>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label>Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <button className="register-btn" onClick={handleRegister}>
            Register
          </button>
        </div>

        <p className="register-login-text">
            Already have an account?{" "}
            <span 
                className="create-login-link"
                onClick={() => navigate("/login")}
            >
                Log In
            </span>
        </p>

      </div>
    </div>
  );
}
