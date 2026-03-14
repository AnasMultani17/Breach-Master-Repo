// src/pages/AuthPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "400px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <div style={{ display: "flex", marginBottom: "20px" }}>
          <button onClick={() => setMode("login")} style={{ flex: 1, background: mode === "login" ? "#ddd" : "#fff" }}>Login</button>
          <button onClick={() => setMode("signup")} style={{ flex: 1, background: mode === "signup" ? "#ddd" : "#fff" }}>Sign Up</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <input name="firstName" placeholder="First Name" onChange={handleChange} required style={{ width: "95%", marginBottom: "10px", padding: "8px" }} />
              <input name="lastName" placeholder="Last Name" onChange={handleChange} required style={{ width: "95%", marginBottom: "10px", padding: "8px" }} />
            </>
          )}
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={{ width: "95%", marginBottom: "10px", padding: "8px" }} />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ width: "95%", marginBottom: "10px", padding: "8px" }} />
          {mode === "signup" && (
            <input name="appPassword" type="password" placeholder="App Password" onChange={handleChange} required style={{ width: "95%", marginBottom: "10px", padding: "8px" }} />
          )}
          
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px" }}>
            {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}

export default AuthPage;