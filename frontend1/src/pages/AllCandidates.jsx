import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowPath, HiOutlineMagnifyingGlass, HiOutlineSparkles,
  HiOutlineXMark, HiOutlineBolt, HiOutlineChatBubbleLeftRight
} from 'react-icons/hi2';
import Navbar from '../components/Navbar';
import CandidateCard from '../components/CandidateCard';
import { useToast } from '../components/Toast';
import './AllCandidates.css';

const API = 'http://localhost:8080';
const AI_API = 'http://localhost:5001';

export default function AllCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Action mode state
  const [mode, setMode] = useState('chat'); // 'chat' or 'action'
  const [actionResults, setActionResults] = useState(null);

  const toast = useToast();

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/api/v1/users/resumes`);
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('Syncing data sources...');
    try {
      try { await axios.get(`${API}/api/candidates/sync`); } catch {}
      try { await axios.get(`${API}/api/candidates/sync-hrms`); } catch {}
      await fetchCandidates();
      toast.success('Data synced successfully!');
    } catch {
      toast.error('Sync failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (mode === 'action') {
      // Execute automated action
      setSearching(true);
      setActionResults(null);
      setAiResult(null);
      try {
        const sid = localStorage.getItem('talentmind_session') || 'action_default';
        const res = await axios.post(`${AI_API}/api/actions/automated`, {
          command: searchQuery,
          session_id: sid,
        });
        setActionResults(res.data);
        if (res.data.needs_clarification) {
          toast.info('⚠️ Multiple candidates found — see details below');
        } else if (res.data.success) {
          toast.success('Action executed successfully!');
          fetchCandidates();
        } else {
          toast.error(res.data.summary || 'Action failed');
        }
      } catch (err) {
        console.error(err);
        const errData = err.response?.data;
        if (errData?.needs_clarification) {
          setActionResults(errData);
          toast.info('⚠️ Multiple candidates found — see details below');
        } else {
          toast.error('Action execution failed');
          setActionResults({ success: false, error: 'Failed to execute action' });
        }
      } finally {
        setSearching(false);
      }
    } else {
      // AI Chat search
      setSearching(true);
      setAiResult(null);
      setActionResults(null);
      try {
        const sessionId = 's_' + Math.random().toString(36).substring(2, 9);
        const res = await axios.post(`${AI_API}/api/chat`, {
          session_id: sessionId,
          message: searchQuery,
        });
        let data = res.data;
        if (data.response) data = data.response;
        if (data.result) data = data.result;
        if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
          data = [data];
        }
        setAiResult(data);
      } catch {
        setAiResult('⚠️ AI could not process that request right now.');
        toast.error('AI search failed');
      } finally {
        setSearching(false);
      }
    }
  };

  const getActionStatusIcon = (status) => {
    if (status === 'done') return '✅';
    if (status === 'error' || status === 'failed') return '❌';
    return '⏳';
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="section-title">Global Talent Pool</h1>
            <p className="section-subtitle">
              {loading ? 'Loading...' : `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} in your database`}
            </p>
          </div>
          <motion.button
            className={`btn btn-ghost ${refreshing ? 'btn-spinning' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HiOutlineArrowPath className={refreshing ? 'icon-spin' : ''} size={18} />
            {refreshing ? 'Syncing...' : 'Sync Sources'}
          </motion.button>
        </div>

        {/* AI Search with Mode Toggle */}
        <div className="ai-search-wrapper">
          {/* Mode Toggle Tabs */}
          <div className="ai-mode-toggle">
            <button
              className={`ai-mode-btn ${mode === 'chat' ? 'active' : ''}`}
              onClick={() => setMode('chat')}
            >
              <HiOutlineChatBubbleLeftRight size={16} />
              <span>AI Chat</span>
            </button>
            <button
              className={`ai-mode-btn ai-mode-btn-action ${mode === 'action' ? 'active' : ''}`}
              onClick={() => setMode('action')}
            >
              <HiOutlineBolt size={16} />
              <span>AI Actions</span>
            </button>
          </div>

          <div className={`ai-search-bar ${mode === 'action' ? 'ai-search-bar-action' : ''}`}>
            <div className="ai-search-icon-wrap">
              {mode === 'action' ? (
                <HiOutlineBolt className="ai-search-bolt" />
              ) : (
                <HiOutlineSparkles className="ai-search-sparkle" />
              )}
            </div>
            <input
              className="ai-search-input"
              type="text"
              placeholder={
                mode === 'action'
                  ? 'Type a command: "Move Rahul Verma to Round 2" or "Hire Anas Multani"'
                  : 'Ask AI: "Find top React devs with 3+ years in Mumbai"'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <motion.button
              className={`btn ${mode === 'action' ? 'btn-action-execute' : 'btn-ai'}`}
              onClick={handleSearch}
              disabled={searching}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {searching ? (
                <><span className="spinner" /> {mode === 'action' ? 'Executing...' : 'Thinking...'}</>
              ) : mode === 'action' ? (
                <><HiOutlineBolt size={16} /> Execute</>
              ) : (
                <><HiOutlineMagnifyingGlass size={16} /> Ask AI</>
              )}
            </motion.button>
          </div>

          {/* Hint text */}
          {mode === 'action' && (
            <motion.p
              className="ai-action-hint"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              💡 Examples: "Move Rahul to Round 2", "Reject Anas", "Hire candidate X", "Change role of Rajan to Software Engineering"
            </motion.p>
          )}
        </div>

        {/* Action Results */}
        <AnimatePresence>
          {actionResults && (
            <motion.div
              className="ai-action-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="ai-results-header">
                <div className="ai-results-title" style={{ color: 'var(--accent-amber)' }}>
                  <HiOutlineBolt size={20} />
                  <h3>Action Results</h3>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setActionResults(null)}>
                  <HiOutlineXMark size={16} /> Dismiss
                </button>
              </div>

              {/* Ambiguity / Clarification */}
              {actionResults.needs_clarification && actionResults.ambiguous_matches ? (
                <div className="ai-action-clarify">
                  <p className="ai-clarify-question">⚠️ {actionResults.clarification_question || 'Which candidate did you mean?'}</p>
                  <div className="ai-clarify-matches">
                    {actionResults.ambiguous_matches.map((m, i) => (
                      <div key={i} className="ai-clarify-card">
                        <strong>{m.fullName}</strong>
                        <span className="ai-clarify-meta">{m.applied_role || 'N/A'} • {m.applicationStage || 'N/A'}</span>
                        <span className="ai-clarify-hint">Use full name: "{m.fullName}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : actionResults.actions_executed && actionResults.actions_executed.length > 0 ? (
                <div className="ai-action-list">
                  {actionResults.actions_executed.map((act, i) => (
                    <motion.div
                      key={i}
                      className="ai-action-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="ai-action-status-icon">{getActionStatusIcon(act.status)}</span>
                      <div className="ai-action-details">
                        <span className="ai-action-type">{act.action?.replace(/_/g, ' ')}</span>
                        {act.candidate_id && (
                          <span className="ai-action-id">ID: {act.candidate_id.substring(0, 8)}...</span>
                        )}
                        {act.new_stage && (
                          <span className={`badge badge-stage badge-stage-${act.new_stage.toLowerCase().replace(/\s/g, '')}`}>
                            → {act.new_stage}
                          </span>
                        )}
                        {act.new_role && (
                          <span className="badge">→ {act.new_role}</span>
                        )}
                      </div>
                      <span className={`ai-action-status ${act.status === 'done' ? 'status-done' : 'status-error'}`}>
                        {act.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : actionResults.summary ? (
                <div className="ai-text-result">
                  {actionResults.summary}
                </div>
              ) : actionResults.error ? (
                <div className="ai-text-result" style={{ borderLeftColor: 'var(--accent-red)' }}>
                  {actionResults.error}
                </div>
              ) : (
                <div className="ai-text-result">
                  {JSON.stringify(actionResults, null, 2)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Chat Results */}
        <AnimatePresence>
          {aiResult && (
            <motion.div
              className="ai-results-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="ai-results-header">
                <div className="ai-results-title">
                  <HiOutlineSparkles size={20} />
                  <h3>AI Insights</h3>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setAiResult(null)}>
                  <HiOutlineXMark size={16} /> Dismiss
                </button>
              </div>

              {Array.isArray(aiResult) ? (
                <div className="grid-candidates">
                  {aiResult.map((c, i) => (
                    <CandidateCard key={i} candidate={c} index={i} aiBadge="AI Match" />
                  ))}
                </div>
              ) : (
                <div className="ai-text-result">{aiResult}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Candidate Grid */}
        {loading ? (
          <div className="grid-candidates">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">No candidates yet</div>
            <div className="empty-state-text">
              Upload resumes or sync from Gmail/HRMS to start building your talent pool.
            </div>
          </div>
        ) : (
          <div className="grid-candidates">
            {candidates.map((c, i) => (
              <CandidateCard key={c._id} candidate={c} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
