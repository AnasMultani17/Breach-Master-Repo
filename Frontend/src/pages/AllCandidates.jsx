import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AllCandidates.css';

const AllCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  return (
    <div className="ac-page">
      <Navbar />

      <main className="ac-main">
        <div className="ac-header">
          <h1 className="ac-title">Global Talent Pool</h1>

          <button
            onClick={handleRefresh}
            className="ac-refresh-btn"
            title="Refresh Talent Pool"
          >
            <svg
              className={isRefreshing ? "spin-animation" : ""}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
            </svg>
          </button>
        </div>

        {isLoading && !isRefreshing ? (
          <div className="ac-loading">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="ac-empty">No candidates found in the database.</div>
        ) : (
          <div className="ac-grid">
            {candidates.map((candidate, index) => (
              <div key={candidate._id} className="ac-card" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="ac-card-header">
                  <div className="ac-card-name">{candidate.fullName}</div>
                  <div className="ac-card-info">
                    <span>📧</span> {candidate.email}
                  </div>
                  {candidate.location && (
                    <div className="ac-card-info">
                      <span>📍</span> {candidate.location.city}, {candidate.location.state}
                    </div>
                  )}
                  <div className="ac-card-role">
                    Applied For: <span>{candidate.applied_role || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <div className="ac-card-section-title">Top Skills</div>
                  <div className="ac-card-skills">
                    {candidate.skills && candidate.skills.map((skill, i) => (
                      <span key={i} className="ac-skill-badge">{skill}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="ac-card-section-title">Experience</div>
                  <div className="ac-card-exp">Total: <strong>{candidate.totalExperienceYears} Years</strong></div>
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