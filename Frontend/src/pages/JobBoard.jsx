import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './JobBoard.css';

const JobBoard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [newJobTitle, setNewJobTitle] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/v1/jobs');
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreateJob = async () => {
    if(!newJobTitle) return;
    try {
      await axios.post('http://localhost:8080/api/v1/jobs', { title: newJobTitle });
      setNewJobTitle('');
      fetchJobs();
    } catch (err) { console.error(err); }
  };

  const openJobPortal = (job) => {
    navigate('/portal', { state: { job } });
  };

  return (
    <div className="jb-page">
      <Navbar />
      <main className="jb-main">
        <div className="jb-header">
          <h2 className="jb-title">Active Roles</h2>
        </div>

        <div className="jb-create-form">
          <input
            type="text"
            placeholder="Job Title (e.g. Software Development)"
            value={newJobTitle}
            onChange={(e) => setNewJobTitle(e.target.value)}
            className="jb-create-input"
          />
          <button className="jb-create-btn" onClick={handleCreateJob}>
            + Add Job
          </button>
        </div>

        {jobs.length === 0 && <p className="jb-empty">No active jobs right now. Create one above!</p>}

        <div className="jb-list">
          {jobs.map((job, index) => (
            <div key={job._id} className="jb-card" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="jb-card-info">
                <div className="jb-card-title">{job.title}</div>
                <div className="jb-card-status">Hiring Active</div>
              </div>
              <button className="jb-card-btn" onClick={() => openJobPortal(job)}>
                Open Pipeline
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default JobBoard;