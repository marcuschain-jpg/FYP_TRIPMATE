import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Login.css";
import axios from "axios";

//Import background picture
import LoginBG from "../Assets/Login.jpg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { errorMsg } = useParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if(errorMsg) {
      showToast(errorMsg, "error");
      return
    }
  }, [])

  const handleLogin = async() => {
    if (!email || !password || !role) {
      showToast("Please fill in all fields.", "error");
      return;
    }


    await axios.post("http://localhost:8080/AuthService/Login", {email, password, role}, {withCredentials:true})
    .then(res => {
      if(res.data.check === false)
      {
        showToast(res.data.message, "error");
        return;
      }
      else if(res.data.check === true)
      {
        const token = res.data.token;
        console.log(res, document.cookie);
        showToast("Login successful! Redirecting...", "success");
        setTimeout(() => navigate(`/home`), 1200);
      }
    })
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
          Where Your Dream Destinations <br />
          Become Reality
        </p>
      </div>

      {/*Login card section --> contais login fields*/}
      <div className="login-card">
        <h2 className="login-title">Welcome Back!</h2>
        <p className="login-subtitle">Login to continue your journey</p>

        {/*User role dropdown */}
        <label className="login-label">Role</label>
        <select
          className="login-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Select Role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        {/*Email field*/}
        <label className="login-label">Email</label>
        <input
          type="email"
          className="login-input"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/*Password field*/}
        <label className="login-label">Password</label>
        <input
          type="password"
          className="login-input"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

         {/*Login button*/}
        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

         {/*Takes user to create account oage if they do not have an account*/} 
        <p className="login-footer">
          Don’t have an account?{" "}
          <span
            className="login-link"
            onClick={() => navigate("/register")}
          >
            Create Account
          </span>
        </p>
      </div>
    </div>
  );
}
