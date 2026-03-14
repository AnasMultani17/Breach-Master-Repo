import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Navigation State
  const [navMenu, setNavMenu] = useState('activeJobs'); 
  const [currentView, setCurrentView] = useState('jobBoard'); 
  
  // Data State
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [activeTab, setActiveTab] = useState('Applied'); 
  const [aiScores, setAiScores] = useState({}); 
  const [isRefreshing, setIsRefreshing] = useState(false); // NEW: Refresh state

  // --- FETCH DATA ---
  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/v1/jobs');
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchCandidatesForJob = async (jobTitle) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/users/resumes?role=${jobTitle}`);
      setCandidates(res.data);
    } catch (err) { console.error(err); }
  };

  // --- MOCK AI FETCHING ---
  const fetchAiRankings = async (jobTitle) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/users/rank/${jobTitle}`);
      const scoreMap = {};
      res.data.forEach(item => {
        scoreMap[item.candidateId] = item.aiScore;
      });
      setAiScores(scoreMap);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (activeTab === 'Round 1' && selectedJob) {
        fetchAiRankings(selectedJob.title);
    }
  }, [activeTab]);

  // --- NEW: REFRESH ACTION ---
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (currentView === 'jobBoard') {
        await fetchJobs();
      } else if (currentView === 'jobPortal' && selectedJob) {
        await fetchCandidatesForJob(selectedJob.title);
        if (activeTab === 'Round 1') {
          await fetchAiRankings(selectedJob.title);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };


  // --- ACTIONS ---
  const handleCreateJob = async () => {
    if(!newJobTitle) return;
    try {
      await axios.post('http://localhost:8080/api/v1/jobs', { title: newJobTitle });
      setNewJobTitle('');
      fetchJobs(); 
    } catch (err) { console.error(err); }
  };

  const openJobPortal = (job) => {
    setSelectedJob(job);
    fetchCandidatesForJob(job.title);
    setCurrentView('jobPortal');
    setActiveTab('Applied');
  };

  const changeCandidateStage = async (candidateId, newStage) => {
    try {
      await axios.put(`http://localhost:8080/api/v1/users/stage/${candidateId}`, { stage: newStage });
      fetchCandidatesForJob(selectedJob.title); 
    } catch (err) { console.error(err); }
  };

  const endCurrentJob = async () => {
    try {
      await axios.put(`http://localhost:8080/api/v1/jobs/${selectedJob._id}/end`);
      setCurrentView('jobBoard');
      setNavMenu('history'); 
      fetchJobs();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
      navigate('/');
  };

  // --- STYLES ---
  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    nav: { display: 'flex', justifyContent: 'space-between', padding: '15px 30px', backgroundColor: '#2c3e50', color: 'white' },
    navLinks: { display: 'flex', gap: '20px', alignItems: 'center' },
    navButton: (isActive) => ({ background: 'none', border: 'none', color: isActive ? '#3498db' : 'white', cursor: 'pointer', fontSize: '16px', fontWeight: isActive ? 'bold' : 'normal' }),
    main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '15px' },
    button: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginRight: '10px' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px', overflowX: 'auto' },
    tab: (isActive) => ({ padding: '10px 20px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal', borderBottom: isActive ? '3px solid #3498db' : 'none' }),
    refreshBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#2c3e50', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  };

  // --- FILTERING ---
  const displayJobs = jobs.filter(j => navMenu === 'activeJobs' ? j.status === 'Active' : j.status === 'Completed');
  
  let filteredCandidates = candidates.filter(c => c.applicationStage === activeTab);
  if (activeTab === 'Round 1') {
      filteredCandidates.sort((a, b) => (aiScores[b._id] || 0) - (aiScores[a._id] || 0));
  }

  return (
    <div style={styles.container}>
      {/* CSS For Spinning Animation */}
      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin-animation { animation: spin 1s linear infinite; }
          .refresh-hover:hover { color: #3498db !important; }
        `}
      </style>

      {/* --- TOP NAVIGATION --- */}
      <nav style={styles.nav}>
        <h2>Recruit AI</h2>
        <div style={styles.navLinks}>
          <button 
            style={styles.navButton(navMenu === 'activeJobs' && currentView === 'jobBoard')} 
            onClick={() => { setNavMenu('activeJobs'); setCurrentView('jobBoard'); }}
          >
            Active Jobs
          </button>
          <button 
            style={styles.navButton(navMenu === 'history' && currentView === 'jobBoard')} 
            onClick={() => { setNavMenu('history'); setCurrentView('jobBoard'); }}
          >
            Job History
          </button>
          <button style={{ ...styles.navButton(false), color: '#e74c3c' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        
        {/* =========================================
            VIEW 1: JOB DASHBOARD 
            ========================================= */}
        {currentView === 'jobBoard' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
              <h2 style={{ margin: 0 }}>{navMenu === 'activeJobs' ? 'Active Roles' : 'Job History'}</h2>
              
              {/* REFRESH BUTTON */}
              <button 
                onClick={handleRefresh} 
                style={styles.refreshBtn}
                className="refresh-hover"
                title="Refresh Data"
              >
                <svg 
                  className={isRefreshing ? "spin-animation" : ""} 
                  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
                </svg>
              </button>
            </div>
            
            {navMenu === 'activeJobs' && (
                <div style={{ marginBottom: '20px' }}>
                <input 
                    type="text" 
                    placeholder="Job Title (e.g. Software Development)" 
                    value={newJobTitle} 
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    style={{ padding: '8px', marginRight: '10px', width: '250px' }}
                />
                <button style={{...styles.button, backgroundColor: '#2ecc71', color: 'white'}} onClick={handleCreateJob}>
                    + Add Job
                </button>
                </div>
            )}

            {displayJobs.length === 0 && <p>No jobs found in this section.</p>}

            <div style={{ display: 'grid', gap: '15px' }}>
              {displayJobs.map(job => (
                <div key={job._id} style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h3 style={{ textTransform: 'capitalize', margin: 0 }}>{job.title}</h3>
                    <p style={{ margin: 0, color: job.status === 'Active' ? 'green' : 'gray' }}>Status: {job.status}</p>
                  </div>
                  <button style={{...styles.button, backgroundColor: navMenu === 'history' ? '#95a5a6' : '#3498db', color: 'white'}} onClick={() => openJobPortal(job)}>
                    {navMenu === 'history' ? 'View History ➡️' : 'Open Portal ➡️'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            VIEW 2: JOB PORTAL
            ========================================= */}
        {currentView === 'jobPortal' && selectedJob && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ margin: 0 }}>Portal: <span style={{ textTransform: 'capitalize' }}>{selectedJob.title}</span> {selectedJob.status === 'Completed' && '(Archived)'}</h2>
                
                {/* REFRESH BUTTON */}
                <button 
                  onClick={handleRefresh} 
                  style={styles.refreshBtn}
                  className="refresh-hover"
                  title="Refresh Pipeline"
                >
                  <svg 
                    className={isRefreshing ? "spin-animation" : ""} 
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
                  </svg>
                </button>
              </div>

              {selectedJob.status === 'Active' && (
                <button style={{...styles.button, backgroundColor: '#e74c3c', color: 'white'}} onClick={endCurrentJob}>
                  🛑 End Job (Move to History)
                </button>
              )}
            </div>

            <div style={styles.tabContainer}>
              {['Applied', 'Round 1', 'Round 2', 'Hired', 'Rejected'].map(tab => (
                <div key={tab} style={styles.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                  {tab} ({candidates.filter(c => c.applicationStage === tab).length})
                </div>
              ))}
            </div>

            {filteredCandidates.length === 0 ? (
              <p>No candidates currently in {activeTab}.</p>
            ) : (
              filteredCandidates.map(candidate => (
                <div key={candidate._id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                      <h3 style={{ margin: '0 0 5px 0' }}>{candidate.fullName}</h3>
                      {activeTab === 'Round 1' && aiScores[candidate._id] && (
                          <span style={{ backgroundColor: '#f9e79f', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                            🤖 AI Score: {aiScores[candidate._id]}/100
                          </span>
                      )}
                  </div>
                  <p style={{ margin: 0, color: '#555' }}>📧 {candidate.email}</p>
                  {candidate.skills && <p style={{ margin: '5px 0' }}><strong>Skills:</strong> {candidate.skills.join(', ')}</p>}

                  {selectedJob.status === 'Active' && (
                    <div style={{ marginTop: '15px' }}>
                        {activeTab === 'Applied' && (
                        <>
                            <button style={{...styles.button, backgroundColor: '#f1c40f'}} onClick={() => changeCandidateStage(candidate._id, 'Round 1')}>Select for Round 1</button>
                            <button style={{...styles.button, backgroundColor: '#e74c3c', color: 'white'}} onClick={() => changeCandidateStage(candidate._id, 'Rejected')}>Reject</button>
                        </>
                        )}
                        {activeTab === 'Round 1' && (
                        <>
                            <button style={{...styles.button, backgroundColor: '#3498db', color: 'white'}} onClick={() => changeCandidateStage(candidate._id, 'Round 2')}>Promote to Round 2</button>
                            <button style={{...styles.button, backgroundColor: '#e74c3c', color: 'white'}} onClick={() => changeCandidateStage(candidate._id, 'Rejected')}>Reject</button>
                        </>
                        )}
                        {activeTab === 'Round 2' && (
                        <>
                            <button style={{...styles.button, backgroundColor: '#2ecc71', color: 'white'}} onClick={() => changeCandidateStage(candidate._id, 'Hired')}>🎉 Final Hire</button>
                            <button style={{...styles.button, backgroundColor: '#e74c3c', color: 'white'}} onClick={() => changeCandidateStage(candidate._id, 'Rejected')}>Reject</button>
                        </>
                        )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;