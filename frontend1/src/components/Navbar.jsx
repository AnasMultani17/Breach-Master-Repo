import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineUsers, HiOutlineBriefcase, HiOutlineCloudArrowUp,
  HiOutlineArrowRightOnRectangle, HiOutlineCpuChip,
  HiOutlineChatBubbleLeftRight, HiOutlineCommandLine,
  HiOutlineChevronDown
} from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import AiHubPanel from './AiHubPanel';
import './Navbar.css';

const navItems = [
  { path: '/dashboard', label: 'All Candidates', icon: HiOutlineUsers },
  { path: '/jobs', label: 'Job Board', icon: HiOutlineBriefcase },
  { path: '/upload', label: 'Upload Resume', icon: HiOutlineCloudArrowUp },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelMode, setAiPanelMode] = useState('chat');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openAiPanel = (mode) => {
    setAiPanelMode(mode);
    setAiPanelOpen(true);
    setAiDropdownOpen(false);
  };

  return (
    <>
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

            {/* AI Hub Dropdown */}
            <div className="tm-ai-hub-wrapper" ref={dropdownRef}>
              <motion.button
                className={`tm-nav-link tm-ai-hub-trigger ${aiDropdownOpen || aiPanelOpen ? 'active' : ''}`}
                onClick={() => setAiDropdownOpen(!aiDropdownOpen)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <HiOutlineCpuChip size={18} />
                <span>AI Hub</span>
                <HiOutlineChevronDown
                  size={14}
                  className={`tm-ai-chevron ${aiDropdownOpen ? 'rotated' : ''}`}
                />
                {(aiDropdownOpen || aiPanelOpen) && <motion.div className="tm-nav-indicator" layoutId="nav-indicator-ai" />}
              </motion.button>

              <AnimatePresence>
                {aiDropdownOpen && (
                  <motion.div
                    className="tm-ai-dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="tm-ai-dropdown-header">AI Assistant</div>
                    <button
                      className="tm-ai-dropdown-item"
                      onClick={() => openAiPanel('chat')}
                    >
                      <div className="tm-ai-dropdown-icon tm-ai-chat-icon">
                        <HiOutlineChatBubbleLeftRight size={18} />
                      </div>
                      <div className="tm-ai-dropdown-content">
                        <span className="tm-ai-dropdown-label">AI Chat</span>
                        <span className="tm-ai-dropdown-desc">Search candidates, get AI insights</span>
                      </div>
                    </button>
                    <button
                      className="tm-ai-dropdown-item"
                      onClick={() => openAiPanel('action')}
                    >
                      <div className="tm-ai-dropdown-icon tm-ai-action-icon">
                        <HiOutlineCommandLine size={18} />
                      </div>
                      <div className="tm-ai-dropdown-content">
                        <span className="tm-ai-dropdown-label">AI Actions</span>
                        <span className="tm-ai-dropdown-desc">Execute commands, manage candidates</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

      {/* AI Hub Panel */}
      <AiHubPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        initialMode={aiPanelMode}
      />
    </>
  );
}
