import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const JobPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedJob = location.state?.job;

  const [candidates, setCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState('Applied'); 
  const [aiScores, setAiScores] = useState({});

  // --- AI SMART MATCH STATE ---
  const [isFetchingAiMatches, setIsFetchingAiMatches] = useState(false);
  const [aiMatchedCandidates, setAiMatchedCandidates] = useState([]);

  useEffect(() => {
    if (!selectedJob) { navigate('/jobs'); return; }
    fetchCandidatesForJob(selectedJob.title);
  }, [selectedJob]);

  useEffect(() => {
    setAiMatchedCandidates([]); 
    if (activeTab === 'Round 1' && selectedJob) fetchAiRankings(selectedJob.title);
  }, [activeTab]);

  const fetchCandidatesForJob = async (jobTitle) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/users/resumes?role=${jobTitle}`);
      setCandidates(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAiRankings = async (jobTitle) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/users/rank/${jobTitle}`);
      const scoreMap = {};
      res.data.forEach(item => { scoreMap[item.candidateId] = item.aiScore; });
      setAiScores(scoreMap);
    } catch (err) { console.error(err); }
  };

  const changeCandidateStage = async (candidateId, newStage) => {
    try {
      await axios.put(`http://localhost:8080/api/v1/users/stage/${candidateId}`, { stage: newStage });
      fetchCandidatesForJob(selectedJob.title); 
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // UPDATED: AI FETCH (Sending IDs Only)
  // ==========================================
  const fetchAiMatches = async () => {
    setIsFetchingAiMatches(true);
    try {
      // 1. Fetch relevant candidates from Node to get their IDs
      console.log(">>> Step 1: Filtering candidates from Node DB...");
      const filteredRes = await axios.get(
        `http://localhost:8080/api/v1/users/ai-match-filter?role=${selectedJob.title}`
      );
      const candidatesToAnalyze = filteredRes.data;

      if (candidatesToAnalyze.length === 0) {
        alert("No candidates found in 'Applied' stage for this role.");
        setIsFetchingAiMatches(false);
        return;
      }

      // --- THE FIX: EXTRACT IDS ONLY ---
      const idsOnly = candidatesToAnalyze.map(c => c._id);
      // ---------------------------------

      // 2. Pass ONLY the IDs + Job Description to Python AI
      const payload = {
        job_description: `Need ${selectedJob.title} Candidate who has most compatible skills for the role`,
        candidate_ids: idsOnly, // Sending just the IDs now
        top_k: 3
      };

      console.log(payload);
      
      console.log(">>> Step 2: Sending IDs to Python AI Matcher...");
      const pyRes = await axios.post("http://localhost:5001/api/match/job-description", payload);
      
      // 3. Get the "Winner" IDs from Python
      const matchedIds = pyRes.data.mongo_ids;

      // 4. Map those IDs back to the full objects we fetched in Step 1
      const winners = candidatesToAnalyze.filter(c => matchedIds.includes(c._id));
      setAiMatchedCandidates(winners);

      console.log(">>> AI Matching Complete. Winners showcased.");

    } catch (err) {
      console.error("AI Match Pipeline Error:", err);
      alert("AI Matching failed. Check console for network logs.");
    } finally {
      setIsFetchingAiMatches(false);
    }
  };
  
  const endCurrentJob = async () => {
    const isSure = window.confirm(`WARNING: This will delete ${selectedJob.title} and all its data.`);
    if (!isSure) return;

    try {
      await axios.delete(`http://localhost:8080/api/v1/jobs/${selectedJob._id}`);
      navigate('/jobs'); 
    } catch (err) { 
      console.error(err); 
      alert("Failed to delete job.");
    }
  };

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '15px' },
    button: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginRight: '10px' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px', overflowX: 'auto' },
    tab: (isActive) => ({ padding: '10px 20px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal', borderBottom: isActive ? '3px solid #3498db' : 'none' }),
    aiMatchContainer: { backgroundColor: '#fdf3ff', border: '1px solid #e0bbf3', padding: '20px', borderRadius: '8px', marginBottom: '30px' },
    aiMatchCard: { backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #8e44ad', boxShadow: '0 4px 10px rgba(142, 68, 173, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    aiBadge: { backgroundColor: '#8e44ad', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }
  };

  if (!selectedJob) return <p>Loading...</p>;

  let filteredCandidates = candidates.filter(c => c.applicationStage === activeTab);
  if (activeTab === 'Round 1') {
      filteredCandidates.sort((a, b) => (aiScores[b._id] || 0) - (aiScores[a._id] || 0));
  }

  const displayAiMatches = aiMatchedCandidates.filter(aiCand => {
    const pipelineCand = candidates.find(c => c._id === aiCand._id);
    if (pipelineCand && pipelineCand.applicationStage !== 'Applied') {
      return false;
    }
    return true;
  });

  return (
    <div style={styles.container}>
      <Navbar />
      <main style={styles.main}>
        <button style={{...styles.button, backgroundColor: '#95a5a6', color: 'white', marginBottom: '20px'}} onClick={() => navigate('/jobs')}>
           ⬅️ Back to Jobs
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Pipeline: <span style={{ textTransform: 'capitalize', color: '#8e44ad' }}>{selectedJob.title}</span></h2>
          <button style={{...styles.button, backgroundColor: '#c0392b', color: 'white', fontWeight: 'bold'}} onClick={endCurrentJob}>
            🗑️ Delete Job & Wipe Candidates
          </button>
        </div>

        <div style={styles.tabContainer}>
          {['Applied', 'Round 1', 'Round 2', 'Hired', 'Rejected'].map(tab => (
            <div key={tab} style={styles.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab} ({candidates.filter(c => c.applicationStage === tab).length})
            </div>
          ))}
        </div>

        {activeTab === 'Applied' && (
          <div style={styles.aiMatchContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#8e44ad' }}>✨ AI Smart Match</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Instantly scan the talent pool to find the top 3 candidates for this role.</p>
              </div>
              <button 
                style={{...styles.button, backgroundColor: '#8e44ad', color: 'white', fontWeight: 'bold'}} 
                onClick={fetchAiMatches}
                disabled={isFetchingAiMatches}
              >
                {isFetchingAiMatches ? '🔍 Scanning...' : '✨ Find Top Candidates'}
              </button>
            </div>

            {displayAiMatches.length > 0 && (
              <div>
                <hr style={{ border: 'none', borderTop: '1px solid #e0bbf3', margin: '15px 0' }}/>
                {displayAiMatches.map(candidate => (
                  <div key={candidate._id} style={styles.aiMatchCard}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50' }}>{candidate.fullName}</h3>
                        <span style={styles.aiBadge}>⭐ AI Choice</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>📧 {candidate.email}</p>
                      {candidate.skills && <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}><strong>Skills:</strong> {candidate.skills.slice(0, 5).join(', ')}</p>}
                    </div>
                    <button 
                      style={{...styles.button, backgroundColor: '#f1c40f', color: 'black', fontWeight: 'bold'}} 
                      onClick={() => changeCandidateStage(candidate._id, 'Round 1')}
                    >
                      Select for Round 1
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredCandidates.length === 0 ? (
          <p>No candidates currently in {activeTab}.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredCandidates.map(candidate => (
              <div key={candidate._id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                    <h3 style={{ margin: '0 0 5px 0', color: '#2980b9' }}>{candidate.fullName}</h3>
                    {activeTab === 'Round 1' && aiScores[candidate._id] && (
                        <span style={{ backgroundColor: '#f9e79f', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>🤖 AI Score: {aiScores[candidate._id]}/100</span>
                    )}
                </div>
                <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>📧 {candidate.email}</p>
                <div style={{ marginTop: '15px' }}>
                    {activeTab === 'Applied' && (
                    <>
                        <button style={{...styles.button, backgroundColor: '#f1c40f'}} onClick={() => changeCandidateStage(candidate._id, 'Round 1')}>Select for Round 1</button>
                        <button style={{...styles.button, backgroundColor: '#e74c3c', color: 'white'}} onClick={() => changeCandidateStage(candidate._id, 'Rejected')}>Reject</button>
                    </>
                    )}
                    {activeTab === 'Round 1' && (
                    <>
                        <button style={{...styles.button, backgroundColor: '#3498db', color: 'white'}} onClick={() => changeCandidateStage(candidate._id, 'Round 2')}>Move to Round 2</button>
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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default JobPortal;