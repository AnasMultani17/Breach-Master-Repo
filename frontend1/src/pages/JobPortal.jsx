import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowLeft, HiOutlineTrash, HiOutlineSparkles,
  HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowUpCircle,
  HiOutlineBolt, HiOutlineXMark
} from 'react-icons/hi2';
import Navbar from '../components/Navbar';
import CandidateCard from '../components/CandidateCard';
import { useToast } from '../components/Toast';
import './JobPortal.css';

const API = 'http://localhost:8080';
const AI_API = 'http://localhost:5001';

const STAGES = ['Applied', 'Round 1', 'Round 2', 'Hired', 'Rejected'];

export default function JobPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const selectedJob = location.state?.job;

  const [candidates, setCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState('Applied');
  const [loading, setLoading] = useState(true);

  // AI Smart Match
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [matchReasons, setMatchReasons] = useState({});

  // AI Command
  const [cmdText, setCmdText] = useState('');
  const [cmdRunning, setCmdRunning] = useState(false);
  const [cmdResults, setCmdResults] = useState(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!selectedJob) { navigate('/jobs'); return; }
    fetchCandidates();
  }, [selectedJob]);

  useEffect(() => {
    setMatchedCandidates([]);
    setMatchReasons({});
  }, [activeTab]);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/api/v1/users/resumes?role=${selectedJob.title}`);
      setCandidates(res.data);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const changeStage = async (id, newStage) => {
    try {
      await axios.put(`${API}/api/v1/users/stage/${id}`, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
      fetchCandidates();
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const handleAiMatch = async () => {
    setMatchLoading(true);
    try {
      const filteredRes = await axios.get(`${API}/api/v1/users/ai-match-filter?role=${selectedJob.title}`);
      const pool = filteredRes.data;
      if (pool.length === 0) {
        toast.info('No candidates in "Applied" stage to match');
        setMatchLoading(false);
        return;
      }
      const ids = pool.map(c => c._id);
      const payload = {
        job_description: `Need ${selectedJob.title} candidate with the most compatible skills for the role`,
        candidate_ids: ids,
        top_k: 3,
      };
      const aiRes = await axios.post(`${AI_API}/api/match/job-description`, payload);
      const matchedIds = aiRes.data.mongo_ids || [];
      const reasons = {};
      if (aiRes.data.reasons) {
        aiRes.data.reasons.forEach(r => {
          reasons[r.mongo_id] = { score: r.score, reason: r.reason };
        });
      }
      const winners = pool.filter(c => matchedIds.includes(c._id));
      setMatchedCandidates(winners);
      setMatchReasons(reasons);
      toast.success(`Found ${winners.length} top matches!`);
    } catch (err) {
      console.error(err);
      toast.error('AI matching failed');
    } finally {
      setMatchLoading(false);
    }
  };

  // AI Natural Language Command
  const handleAiCommand = async () => {
    if (!cmdText.trim()) return;
    setCmdRunning(true);
    setCmdResults(null);
    try {
      const sid = localStorage.getItem('talentmind_session') || 'action_default';
      const res = await axios.post(`${AI_API}/api/actions/automated`, { command: cmdText, session_id: sid });
      setCmdResults(res.data);
      if (res.data.needs_clarification) {
        toast.info('⚠️ Multiple candidates found — see details below');
      } else if (res.data.success) {
        toast.success('Action executed!');
        setCmdText('');
        fetchCandidates();
      } else {
        toast.error(res.data.summary || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      if (errData?.needs_clarification) {
        setCmdResults(errData);
        toast.info('⚠️ Multiple candidates found — see details below');
      } else {
        toast.error('Action failed');
        setCmdResults({ success: false, error: 'Failed to execute action' });
      }
    } finally {
      setCmdRunning(false);
    }
  };

  const handleDeleteJob = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/api/v1/jobs/${selectedJob._id}`);
      toast.success('Job and candidates deleted');
      navigate('/jobs');
    } catch {
      toast.error('Failed to delete job');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!selectedJob) return null;

  const filtered = candidates.filter(c => c.applicationStage === activeTab);
  const stageCounts = {};
  STAGES.forEach(s => { stageCounts[s] = candidates.filter(c => c.applicationStage === s).length; });

  // Filter AI matches: only show if still in Applied
  const displayMatches = matchedCandidates.filter(mc => {
    const curr = candidates.find(c => c._id === mc._id);
    return !curr || curr.applicationStage === 'Applied';
  });

  const getActions = (candidate) => {
    const stage = candidate.applicationStage;
    const btns = [];
    if (stage === 'Applied') {
      btns.push(
        <button key="r1" className="btn btn-primary btn-sm" onClick={() => changeStage(candidate._id, 'Round 1')}>
          <HiOutlineArrowRight size={14} /> Round 1
        </button>,
        <button key="rej" className="btn btn-danger btn-sm" onClick={() => changeStage(candidate._id, 'Rejected')}>
          <HiOutlineXCircle size={14} /> Reject
        </button>
      );
    } else if (stage === 'Round 1') {
      btns.push(
        <button key="r2" className="btn btn-primary btn-sm" onClick={() => changeStage(candidate._id, 'Round 2')}>
          <HiOutlineArrowRight size={14} /> Round 2
        </button>,
        <button key="rej" className="btn btn-danger btn-sm" onClick={() => changeStage(candidate._id, 'Rejected')}>
          <HiOutlineXCircle size={14} /> Reject
        </button>
      );
    } else if (stage === 'Round 2') {
      btns.push(
        <button key="hire" className="btn btn-success btn-sm" onClick={() => changeStage(candidate._id, 'Hired')}>
          <HiOutlineCheckCircle size={14} /> Hire
        </button>,
        <button key="rej" className="btn btn-danger btn-sm" onClick={() => changeStage(candidate._id, 'Rejected')}>
          <HiOutlineXCircle size={14} /> Reject
        </button>
      );
    }
    return btns.length > 0 ? btns : null;
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        {/* Back Button & Header */}
        <div className="jp-top-bar">
          <motion.button
            className="btn btn-ghost"
            onClick={() => navigate('/jobs')}
            whileHover={{ scale: 1.03 }}
          >
            <HiOutlineArrowLeft size={18} /> Back to Jobs
          </motion.button>

          <motion.button
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
            whileHover={{ scale: 1.03 }}
          >
            <HiOutlineTrash size={16} /> Delete Job
          </motion.button>
        </div>

        <div className="jp-header">
          <div className="jp-header-info">
            <h1 className="section-title" style={{ textTransform: 'capitalize' }}>
              {selectedJob.title}
            </h1>
            <p className="section-subtitle">Recruitment Pipeline • {candidates.length} total candidates</p>
          </div>
        </div>

        {/* AI Natural Language Command Bar */}
        <motion.div
          className="jp-cmd-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="jp-cmd-bar">
            <HiOutlineBolt className="jp-cmd-bolt" size={20} />
            <input
              className="jp-cmd-input"
              placeholder={`Try: "Move Rahul Verma to Round 2" or "Hire Anas Multani"`}
              value={cmdText}
              onChange={(e) => setCmdText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
            />
            <motion.button
              className="btn btn-action-execute btn-sm"
              onClick={handleAiCommand}
              disabled={cmdRunning || !cmdText.trim()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {cmdRunning ? (
                <><span className="spinner" /> Running...</>
              ) : (
                <><HiOutlineBolt size={14} /> Execute</>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {cmdResults && (
              <motion.div
                className="jp-cmd-results"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="jp-cmd-results-header">
                  <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>⚡ Results</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCmdResults(null)}>
                    <HiOutlineXMark size={14} />
                  </button>
                </div>
                {/* Ambiguity / Clarification */}
                {cmdResults.needs_clarification && cmdResults.ambiguous_matches ? (
                  <div className="ai-action-clarify" style={{ marginTop: 10 }}>
                    <p style={{ fontWeight: 600, color: 'var(--accent-amber)', margin: '0 0 8px 0', fontSize: 13 }}>
                      ⚠️ {cmdResults.clarification_question || 'Multiple candidates found. Which one?'}
                    </p>
                    {cmdResults.ambiguous_matches.map((m, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, marginBottom: 6 }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{m.fullName}</strong>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{m.applied_role || 'N/A'} • {m.applicationStage || 'N/A'}</span>
                        <span style={{ fontSize: 10, color: 'var(--accent-amber)', fontStyle: 'italic' }}>Use: "{m.fullName}"</span>
                      </div>
                    ))}
                  </div>
                ) : cmdResults.actions_executed && cmdResults.actions_executed.length > 0 ? (
                  <div className="jp-cmd-actions">
                    {cmdResults.actions_executed.map((act, i) => (
                      <div key={i} className="jp-cmd-action-row">
                        <span>{act.status === 'done' ? '✅' : '❌'}</span>
                        <span className="jp-cmd-action-type">{act.action?.replace(/_/g, ' ')}</span>
                        {act.new_stage && (
                          <span className={`badge badge-stage badge-stage-${act.new_stage.toLowerCase().replace(/\s/g, '')}`}>
                            → {act.new_stage}
                          </span>
                        )}
                        {act.new_role && (
                          <span className="badge">→ {act.new_role}</span>
                        )}
                        <span className={act.status === 'done' ? 'status-done' : 'status-error'} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>
                          {act.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : cmdResults.summary ? (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{cmdResults.summary}</p>
                ) : cmdResults.error ? (
                  <p style={{ color: 'var(--accent-red)', fontSize: 13, margin: '8px 0 0' }}>{cmdResults.error}</p>
                ) : (
                  <pre style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{JSON.stringify(cmdResults, null, 2)}</pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stage Tabs */}
        <div className="tabs">
          {STAGES.map(stage => (
            <button
              key={stage}
              className={`tab ${activeTab === stage ? 'active' : ''}`}
              onClick={() => setActiveTab(stage)}
            >
              {stage}
              <span className="tab-count">{stageCounts[stage]}</span>
            </button>
          ))}
        </div>

        {/* AI Smart Match - Only on Applied tab */}
        {activeTab === 'Applied' && (
          <motion.div
            className="jp-ai-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="jp-ai-header">
              <div>
                <h3 className="jp-ai-title">
                  <HiOutlineSparkles size={20} /> AI Smart Match
                </h3>
                <p className="jp-ai-desc">
                  Let AI analyze the talent pool and find the best candidates for this role
                </p>
              </div>
              <motion.button
                className="btn btn-ai"
                onClick={handleAiMatch}
                disabled={matchLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {matchLoading ? (
                  <><span className="spinner" /> Scanning...</>
                ) : (
                  <><HiOutlineSparkles size={16} /> Find Top Candidates</>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {displayMatches.length > 0 && (
                <motion.div
                  className="jp-ai-matches"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="jp-ai-divider" />
                  <div className="grid-candidates">
                    {displayMatches.map((c, i) => {
                      const r = matchReasons[c._id];
                      const enriched = { ...c };
                      if (r?.reason) enriched._aiReason = r.reason;
                      return (
                        <CandidateCard
                          key={c._id}
                          candidate={enriched}
                          index={i}
                          aiBadge="⭐ AI Pick"
                          aiScore={r?.score}
                          actions={
                            <button className="btn btn-primary btn-sm" onClick={() => changeStage(c._id, 'Round 1')}>
                              <HiOutlineArrowUpCircle size={14} /> Move to Round 1
                            </button>
                          }
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Candidate List */}
        {loading ? (
          <div className="grid-candidates">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {activeTab === 'Hired' ? '🎉' : activeTab === 'Rejected' ? '⛔' : '📋'}
            </div>
            <div className="empty-state-title">No candidates in {activeTab}</div>
            <div className="empty-state-text">
              {activeTab === 'Applied'
                ? 'Upload resumes or sync data sources to add candidates'
                : 'Move candidates through the pipeline stages'}
            </div>
          </div>
        ) : (
          <div className="grid-candidates">
            {filtered.map((c, i) => (
              <CandidateCard
                key={c._id}
                candidate={c}
                index={i}
                actions={getActions(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="jp-modal-icon">⚠️</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Delete Job?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                This will permanently delete <strong style={{ textTransform: 'capitalize' }}>{selectedJob.title}</strong> and
                <strong style={{ color: 'var(--accent-red)' }}> all associated candidates</strong>.
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={handleDeleteJob}
                  disabled={deleting}
                >
                  {deleting ? <span className="spinner" /> : <HiOutlineTrash size={16} />}
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
