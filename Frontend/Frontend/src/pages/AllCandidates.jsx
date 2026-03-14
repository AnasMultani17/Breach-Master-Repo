import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const AllCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); 

  // --- AI SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/v1/users/resumes');
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false); 
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Handler for the refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log("Starting full data sync...");

      // 1. Fire the Gmail Sync
      try {
        console.log("Syncing from Gmail...");
        await axios.get('http://localhost:8080/api/candidates/sync');
      } catch (err) {
        console.error("Gmail sync encountered an issue, but continuing...", err);
      }

      // 2. Fire the HRMS Sync
      try {
        console.log("Syncing from HRMS...");
        await axios.get('http://localhost:8080/api/candidates/sync-hrms');
      } catch (err) {
        console.error("HRMS sync encountered an issue, but continuing...", err);
      }

      // 3. Finally, fetch the updated list of candidates from your database to show on screen!
      console.log("Syncs complete! Refreshing dashboard data...");
      fetchCandidates();

    } catch (globalError) {
      console.error("Something went wrong with the refresh button:", globalError);
    } finally {
      // Stop the spinning animation no matter what happens
      setIsRefreshing(false);
    }
  };

  // --- AI SEARCH HANDLER ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setAiResult(null); // Clear previous results

    try {
      // Generate a random session ID
      const randomSessionId = "s_" + Math.random().toString(36).substring(2, 9);

      const payload = {
        session_id: randomSessionId,
        message: searchQuery
      };

      console.log(">>> Sending to AI:", payload);

      const response = await axios.post("http://localhost:5001/api/chat", payload);
      let data = response.data;

      // Ensure we pull the right data if the backend wraps it
      if (data.response) data = data.response;
      if (data.result) data = data.result;

      // Normalize object to array so our UI can map it safely if it's a schema
      if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
          data = [data]; 
      }

      setAiResult(data);
      console.log(">>> AI Response:", data);

    } catch (error) {
      console.error("AI Search Error:", error);
      setAiResult("⚠️ Oops! The AI couldn't process that request right now.");
    } finally {
      setIsSearching(false);
    }
  };

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    header: { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' },
    badge: { backgroundColor: '#e1f5fe', color: '#0288d1', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', marginRight: '5px', display: 'inline-block', marginBottom: '5px' },
    refreshBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#2c3e50', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '5px' },
    
    // AI SEARCH STYLES
    searchContainer: { display: 'flex', gap: '10px', marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    searchInput: { flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' },
    searchButton: { padding: '12px 24px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    aiResultBox: { backgroundColor: '#f8f9fa', borderLeft: '4px solid #8e44ad', padding: '20px', borderRadius: '4px', marginBottom: '30px', color: '#2c3e50', whiteSpace: 'pre-wrap' }
  };

  return (
    <div style={styles.container}>
      {/* CSS for the smooth spinning animation */}
      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin-animation { animation: spin 1s linear infinite; }
          .refresh-hover:hover { color: #3498db !important; }
        `}
      </style>

      <Navbar />
      
      <main style={styles.main}>
        {/* Flex container to align the Title and the Refresh Button side-by-side */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>Global Talent Pool</h1>
          
          {/* THE REFRESH BUTTON */}
          <button 
            onClick={handleRefresh} 
            style={styles.refreshBtn}
            className="refresh-hover"
            title="Refresh Talent Pool"
          >
            <svg 
              className={isRefreshing ? "spin-animation" : ""} 
              width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
            </svg>
          </button>
        </div>

        {/* =========================================
            AI SEARCH BAR
            ========================================= */}
        <div style={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Ask AI: Compare skills of Anas Multani and Karmit..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button style={styles.searchButton} onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <><span className="spin-animation">⏳</span> Thinking...</>
            ) : (
              <>✨ Ask AI</>
            )}
          </button>
        </div>

        {/* --- AI SEARCH RESULTS RENDERING --- */}
        {aiResult && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: '#8e44ad', marginTop: 0 }}>🤖 AI Insights</h3>
            
            {/* Case 1: The AI returned an Array of Candidate Schemas */}
            {Array.isArray(aiResult) ? (
              <div style={styles.cardGrid}>
                {aiResult.map((candidate, idx) => (
                  <div key={idx} style={styles.card}>
                    <div style={styles.header}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#2980b9' }}>{candidate.fullName || 'Candidate Record'}</h3>
                      <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>📧 {candidate.email}</p>
                      {candidate.location && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>📍 {candidate.location.city || ''}, {candidate.location.state || ''}</p>
                      )}
                    </div>
                    {candidate.skills && (
                      <div>
                        <h4 style={{ fontSize: '14px', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '5px' }}>Top Skills</h4>
                        <div>
                          {candidate.skills.map((skill, i) => <span key={i} style={styles.badge}>{skill}</span>)}
                        </div>
                      </div>
                    )}
                    {candidate.totalExperienceYears !== undefined && (
                      <div style={{ marginTop: '15px' }}>
                        <h4 style={{ fontSize: '14px', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '5px' }}>Experience</h4>
                        <p style={{ fontSize: '14px', margin: 0 }}>Total: {candidate.totalExperienceYears} Years</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Case 2: The AI returned a Text String */
              <div style={styles.aiResultBox}>
                {aiResult}
              </div>
            )}
            
            <button 
              style={{...styles.badge, backgroundColor: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer', padding: '8px 16px', marginTop: '15px'}} 
              onClick={() => setAiResult(null)}
            >
              Close AI Results
            </button>
            <hr style={{ margin: '30px 0', border: '1px solid #eee' }} />
          </div>
        )}
        
        {/* --- EXISTING CANDIDATE GRID --- */}
        {isLoading && !isRefreshing ? (
          <p>Loading candidates...</p>
        ) : candidates.length === 0 ? (
          <p>No candidates found in the database.</p>
        ) : (
          <div style={styles.cardGrid}>
            {candidates.map((candidate) => (
              <div key={candidate._id} style={styles.card}>
                <div style={styles.header}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#2980b9' }}>{candidate.fullName}</h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>📧 {candidate.email}</p>
                  {candidate.location && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>📍 {candidate.location.city}, {candidate.location.state}</p>
                  )}
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>
                    Applied For: <span style={{ textTransform: 'capitalize', color: '#8e44ad'}}>{candidate.applied_role || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '5px' }}>Top Skills</h4>
                  <div>
                    {candidate.skills && candidate.skills.map((skill, index) => (
                      <span key={index} style={styles.badge}>{skill}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <h4 style={{ fontSize: '14px', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '5px' }}>Experience</h4>
                  <p style={{ fontSize: '14px', margin: 0 }}>Total: {candidate.totalExperienceYears} Years</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllCandidates;