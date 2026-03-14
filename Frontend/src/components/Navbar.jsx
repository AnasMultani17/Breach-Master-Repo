import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/');
  };

  const styles = {
    nav: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '15px 30px', 
      backgroundColor: '#2c3e50', 
      color: 'white',
      alignItems: 'center'
    },
    navLinks: { 
      display: 'flex', 
      gap: '20px', 
      alignItems: 'center' 
    },
    navButton: (isActive) => ({ 
      background: 'none', 
      border: 'none', 
      color: isActive ? '#3498db' : 'white', 
      cursor: 'pointer', 
      fontSize: '16px', 
      fontWeight: isActive ? 'bold' : 'normal',
      transition: '0.3s'
    })
  };

  return (
    <nav style={styles.nav}>
      <h2 style={{ margin: 0 }}>Recruit AI</h2>
      <div style={styles.navLinks}>
        {/* All Candidates Link */}
        <button 
          style={styles.navButton(location.pathname === '/dashboard')} 
          onClick={() => navigate('/dashboard')}
        >
          All Candidates
        </button>

        {/* Job Board Link */}
        <button 
          style={styles.navButton(location.pathname === '/jobs')} 
          onClick={() => navigate('/jobs')}
        >
          Job Board
        </button>
        
        {/* Upload Resume Link (New Separate Page) */}
        <button 
          style={{
            ...styles.navButton(location.pathname === '/upload'), 
            color: location.pathname === '/upload' ? '#3498db' : '#9b59b6', 
            fontWeight: 'bold'
          }} 
          onClick={() => navigate('/upload')}
        >
          🚀 Upload Resume
        </button>

        {/* Logout */}
        <button 
          style={{ ...styles.navButton(false), color: '#e74c3c' }} 
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;