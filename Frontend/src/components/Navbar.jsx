import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = [
    { path: '/dashboard', label: 'All Candidates' },
    { path: '/jobs', label: 'Job Board' },
    { path: '/compare', label: 'Compare' },
    { path: '/ai-hub', label: 'AI Hub', accent: true },
    { path: '/upload', label: 'Upload Resume', accent: true },
  ];

  const renderLinks = () => (
    <>
      {links.map(link => (
        <button
          key={link.path}
          className={`rc-navbar-link${location.pathname === link.path ? ' active' : ''}${link.accent && location.pathname !== link.path ? ' rc-navbar-link--accent' : ''}`}
          onClick={() => navigate(link.path)}
        >
          {link.label}
        </button>
      ))}
      <button
        className="rc-navbar-link rc-navbar-link--danger"
        onClick={handleLogout}
      >
        Logout
      </button>
    </>
  );

  return (
    <>
      <nav className={`rc-navbar${scrolled ? ' scrolled' : ''}`}>
        <span className="rc-navbar-logo" onClick={() => navigate('/dashboard')}>
          Recruise
        </span>

        <div className="rc-navbar-links">
          {renderLinks()}
        </div>

        <button
          className="rc-navbar-burger"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>

      <div className={`rc-navbar-mobile${mobileOpen ? ' open' : ''}`}>
        {renderLinks()}
      </div>
    </>
  );
};

export default Navbar;