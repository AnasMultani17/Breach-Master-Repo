import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser, HiOutlineKey } from 'react-icons/hi2';
import { useToast } from '../components/Toast';
import './AuthPage.css';

const API = 'http://localhost:8080/api/v1/users';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', appPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = mode === 'signup' ? '/register' : '/login';
    const body = mode === 'signup' ? form : { email: form.email, password: form.password };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false)) {
        toast.success(mode === 'signup' ? 'Account created!' : 'Welcome back!');
        setTimeout(() => navigate('/dashboard'), 400);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch {
      toast.error('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background effects */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left Hero */}
        <div className="auth-hero">
          <div className="auth-hero-content">
            <div className="auth-hero-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#ag1)" />
                <path d="M2 17l10 5 10-5" stroke="url(#ag1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="url(#ag1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="ag1" x1="2" y1="2" x2="22" y2="22">
                    <stop stopColor="#a855f7" />
                    <stop offset="1" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="auth-hero-title">TalentMind</h1>
            <p className="auth-hero-subtitle">AI-Powered Recruitment Platform</p>
            <div className="auth-hero-features">
              <div className="auth-hero-feature">
                <span className="auth-hero-feature-icon">🤖</span>
                <span>AI-Powered Candidate Matching</span>
              </div>
              <div className="auth-hero-feature">
                <span className="auth-hero-feature-icon">📊</span>
                <span>Smart Recruitment Pipeline</span>
              </div>
              <div className="auth-hero-feature">
                <span className="auth-hero-feature-icon">⚡</span>
                <span>Automated Resume Processing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-panel">
          {/* Tab Toggle */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              className="auth-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="auth-form-title">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-form-subtitle">
                {mode === 'login'
                  ? 'Enter your credentials to access your dashboard'
                  : 'Set up your HR account to get started'}
              </p>

              {mode === 'signup' && (
                <div className="auth-row">
                  <div className="auth-field">
                    <label>First Name</label>
                    <div className="auth-input-wrap">
                      <HiOutlineUser className="auth-input-icon" />
                      <input
                        className="input"
                        name="firstName"
                        placeholder="John"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Last Name</label>
                    <div className="auth-input-wrap">
                      <HiOutlineUser className="auth-input-icon" />
                      <input
                        className="input"
                        name="lastName"
                        placeholder="Doe"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label>Email Address</label>
                <div className="auth-input-wrap">
                  <HiOutlineEnvelope className="auth-input-icon" />
                  <input
                    className="input"
                    name="email"
                    type="email"
                    placeholder="hr@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <HiOutlineLockClosed className="auth-input-icon" />
                  <input
                    className="input"
                    name="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="auth-field">
                  <label>App Password</label>
                  <div className="auth-input-wrap">
                    <HiOutlineKey className="auth-input-icon" />
                    <input
                      className="input"
                      name="appPassword"
                      type="password"
                      placeholder="Gmail app password for email sync"
                      value={form.appPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <button className="btn btn-ai btn-lg auth-submit" type="submit" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Processing...</>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
