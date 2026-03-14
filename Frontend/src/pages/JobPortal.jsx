import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './JobPortal.css';

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
    <div className="jp-page">
      <Navbar />
      <main className="jp-main">
        <button className="jp-back-btn" onClick={() => navigate('/jobs')}>
          ← Back to Jobs
        </button>

        <div className="jp-header">
          <h2 className="jp-title">Pipeline: <span>{selectedJob.title}</span></h2>
          <button className="jp-delete-btn" onClick={endCurrentJob}>
            Delete Job & Wipe Candidates
          </button>
        </div>

        <div className="jp-tabs">
          {['Applied', 'Round 1', 'Round 2', 'Hired', 'Rejected'].map(tab => (
            <button
              key={tab}
              className={`jp-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({candidates.filter(c => c.applicationStage === tab).length})
            </button>
          ))}
        </div>

        {activeTab === 'Applied' && (
          <div className="jp-ai-section">
            <div className="jp-ai-header">
              <div>
                <div className="jp-ai-title">AI Smart Match</div>
                <p className="jp-ai-desc">Instantly scan the talent pool to find the top 3 candidates for this role.</p>
              </div>
              <button
                className="jp-ai-btn"
                onClick={fetchAiMatches}
                disabled={isFetchingAiMatches}
              >
                {isFetchingAiMatches ? 'Scanning...' : 'Find Top Candidates'}
              </button>
            </div>

            {displayAiMatches.length > 0 && (
              <div>
                <hr className="jp-ai-divider" />
                {displayAiMatches.map(candidate => (
                  <div key={candidate._id} className="jp-ai-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <div className="jp-card-name">{candidate.fullName}</div>
                        <span className="jp-ai-badge">AI Choice</span>
                      </div>
                      <p className="jp-card-email">📧 {candidate.email}</p>
                      {candidate.skills && <p className="jp-card-skills"><strong>Skills:</strong> {candidate.skills.slice(0, 5).join(', ')}</p>}
                    </div>
                    <button
                      className="jp-action-btn jp-action-btn--select"
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
          <p className="jp-empty">No candidates currently in {activeTab}.</p>
        ) : (
          <div className="jp-candidates">
            {filteredCandidates.map((candidate, index) => (
              <div key={candidate._id} className="jp-card" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="jp-card-top">
                  <div className="jp-card-name">{candidate.fullName}</div>
                  {activeTab === 'Round 1' && aiScores[candidate._id] && (
                    <span className="jp-ai-score">AI Score: {aiScores[candidate._id]}/100</span>
                  )}
                </div>
                <p className="jp-card-email">📧 {candidate.email}</p>
                <div className="jp-card-actions">
                  {activeTab === 'Applied' && (
                    <>
                      <button className="jp-action-btn jp-action-btn--select" onClick={() => changeCandidateStage(candidate._id, 'Round 1')}>Select for Round 1</button>
                      <button className="jp-action-btn jp-action-btn--reject" onClick={() => changeCandidateStage(candidate._id, 'Rejected')}>Reject</button>
                    </>
                  )}
                  {activeTab === 'Round 1' && (
                    <>
                      <button className="jp-action-btn jp-action-btn--promote" onClick={() => changeCandidateStage(candidate._id, 'Round 2')}>Move to Round 2</button>
                      <button className="jp-action-btn jp-action-btn--reject" onClick={() => changeCandidateStage(candidate._id, 'Rejected')}>Reject</button>
                    </>
                  )}
                  {activeTab === 'Round 2' && (
                    <>
                      <button className="jp-action-btn jp-action-btn--hire" onClick={() => changeCandidateStage(candidate._id, 'Hired')}>Final Hire</button>
                      <button className="jp-action-btn jp-action-btn--reject" onClick={() => changeCandidateStage(candidate._id, 'Rejected')}>Reject</button>
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