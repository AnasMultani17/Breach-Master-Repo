import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

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

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    button: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginRight: '10px' }
  };

  return (
    <div style={styles.container}>
      <Navbar />
      <main style={styles.main}>
        <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>Active Roles</h2>

        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Job Title (e.g. Software Development)" 
            value={newJobTitle} 
            onChange={(e) => setNewJobTitle(e.target.value)}
            style={{ padding: '10px', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button style={{...styles.button, backgroundColor: '#2ecc71', color: 'white'}} onClick={handleCreateJob}>
            + Add Job
          </button>
        </div>

        {jobs.length === 0 && <p>No active jobs right now. Create one above!</p>}

        <div style={{ display: 'grid', gap: '15px' }}>
          {jobs.map(job => (
            <div key={job._id} style={styles.card}>
              <div>
                <h3 style={{ textTransform: 'capitalize', margin: 0, color: '#2980b9' }}>{job.title}</h3>
                <p style={{ margin: '5px 0 0 0', color: '#27ae60', fontSize: '14px', fontWeight: 'bold' }}>🟢 Hiring Active</p>
              </div>
              <button style={{...styles.button, backgroundColor: '#3498db', color: 'white'}} onClick={() => openJobPortal(job)}>
                Open Pipeline ➡️
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default JobBoard;