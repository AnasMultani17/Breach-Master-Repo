import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineArrowRight, HiOutlineBriefcase, HiOutlineCheckCircle } from 'react-icons/hi2';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';
import './JobBoard.css';

const API = 'http://localhost:8080';

export default function JobBoard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/api/v1/jobs`);
      setJobs(res.data);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await axios.post(`${API}/api/v1/jobs`, { title: newTitle });
      toast.success(`Job "${newTitle}" created!`);
      setNewTitle('');
      fetchJobs();
    } catch {
      toast.error('Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const openPipeline = (job) => {
    navigate('/portal', { state: { job } });
  };

  const activeJobs = jobs.filter(j => j.status === 'Active');
  const completedJobs = jobs.filter(j => j.status === 'Completed');

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="section-title">Job Board</h1>
            <p className="section-subtitle">Manage recruitment roles and hiring pipelines</p>
          </div>
        </div>

        {/* Create Job */}
        <div className="jb-create-card">
          <div className="jb-create-icon">
            <HiOutlineBriefcase size={24} />
          </div>
          <div className="jb-create-content">
            <h3>Create New Role</h3>
            <p>Add a job title to start building your recruitment pipeline</p>
          </div>
          <div className="jb-create-form">
            <input
              className="input"
              placeholder="e.g. Software Development"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <motion.button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {creating ? <span className="spinner" /> : <HiOutlinePlus size={18} />}
              Add Job
            </motion.button>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="jb-section">
          <div className="jb-section-header">
            <h2 className="jb-section-title">
              <span className="jb-status-dot jb-status-active" />
              Active Roles
            </h2>
            <span className="jb-count">{activeJobs.length}</span>
          </div>

          {loading ? (
            <div className="grid-jobs">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: 140 }} />)}
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">💼</div>
              <div className="empty-state-title">No active roles</div>
              <div className="empty-state-text">Create a job above to start hiring</div>
            </div>
          ) : (
            <div className="grid-jobs">
              <AnimatePresence>
                {activeJobs.map((job, i) => (
                  <motion.div
                    key={job._id}
                    className="jb-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => openPipeline(job)}
                  >
                    <div className="jb-card-top">
                      <div className="jb-card-icon">
                        <HiOutlineBriefcase size={20} />
                      </div>
                      <div>
                        <h3 className="jb-card-title">{job.title}</h3>
                        <p className="jb-card-date">
                          Created {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="jb-card-bottom">
                      <span className="badge badge-success">
                        <span className="jb-status-dot jb-status-active" style={{ marginRight: 4 }} />
                        Active
                      </span>
                      <span className="jb-card-arrow">
                        Open Pipeline <HiOutlineArrowRight size={16} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div className="jb-section">
            <div className="jb-section-header">
              <h2 className="jb-section-title">
                <HiOutlineCheckCircle size={20} style={{ color: 'var(--text-muted)' }} />
                Completed
              </h2>
              <span className="jb-count">{completedJobs.length}</span>
            </div>
            <div className="grid-jobs">
              {completedJobs.map((job, i) => (
                <motion.div
                  key={job._id}
                  className="jb-card jb-card-completed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="jb-card-top">
                    <div className="jb-card-icon" style={{ opacity: 0.5 }}>
                      <HiOutlineBriefcase size={20} />
                    </div>
                    <div>
                      <h3 className="jb-card-title" style={{ opacity: 0.6 }}>{job.title}</h3>
                      <p className="jb-card-date">Completed</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
