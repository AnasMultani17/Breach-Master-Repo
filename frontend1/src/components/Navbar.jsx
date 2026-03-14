import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineUsers, HiOutlineBriefcase, HiOutlineCloudArrowUp, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import './Navbar.css';

const navItems = [
  { path: '/dashboard', label: 'All Candidates', icon: HiOutlineUsers },
  { path: '/jobs', label: 'Job Board', icon: HiOutlineBriefcase },
  { path: '/upload', label: 'Upload Resume', icon: HiOutlineCloudArrowUp },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="tm-navbar">
      <div className="tm-navbar-inner">
        {/* Brand */}
        <div className="tm-brand" onClick={() => navigate('/dashboard')}>
          <div className="tm-brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#grad1)"/>
              <path d="M2 17l10 5 10-5" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="grad1" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#a855f7"/>
                  <stop offset="1" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="tm-brand-text">TalentMind</span>
          <span className="tm-brand-badge">AI</span>
        </div>

        {/* Nav Links */}
        <div className="tm-nav-links">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                className={`tm-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {isActive && <motion.div className="tm-nav-indicator" layoutId="nav-indicator" />}
              </motion.button>
            );
          })}
        </div>

        {/* Logout */}
        <motion.button
          className="tm-logout-btn"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiOutlineArrowRightOnRectangle size={18} />
          <span>Logout</span>
        </motion.button>
      </div>
    </nav>
  );
}
