// src/pages/AuthPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

const API_BASE_URL = "http://localhost:8080/api/v1/users";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", appPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "signup" ? "/register" : "/login";

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mode === "signup" ? formData : {
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (res.ok && (data.success || data)) {
        // Redirect to separate dashboard page
        navigate("/dashboard");
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-name">Recruise</div>
          <p className="auth-brand-tagline">Smart Recruitment Platform</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === "login" ? " active" : ""}`} onClick={() => setMode("login")}>Login</button>
          <button className={`auth-tab${mode === "signup" ? " active" : ""}`} onClick={() => setMode("signup")}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <input name="firstName" placeholder="First Name" onChange={handleChange} required className="auth-input" />
              <input name="lastName" placeholder="Last Name" onChange={handleChange} required className="auth-input" />
            </>
          )}
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="auth-input" />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="auth-input" />
          {mode === "signup" && (
            <input name="appPassword" type="password" placeholder="App Password" onChange={handleChange} required className="auth-input" />
          )}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>
        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}

export default AuthPage;