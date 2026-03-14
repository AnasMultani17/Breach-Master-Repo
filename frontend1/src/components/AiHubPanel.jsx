import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineXMark, HiOutlinePaperAirplane, HiOutlineSparkles,
  HiOutlineBolt, HiOutlineTrash, HiOutlineUser, HiOutlineCpuChip,
  HiOutlineCommandLine, HiOutlineChatBubbleLeftRight,
  HiOutlineEnvelope, HiOutlineMapPin, HiOutlineBriefcase, HiOutlineAcademicCap
} from 'react-icons/hi2';
import './AiHubPanel.css';

const AI_API = 'http://localhost:5001';
const BACKEND_API = 'http://localhost:8080';

function getSessionId() {
  let sid = localStorage.getItem('talentmind_session');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('talentmind_session', sid);
  }
  return sid;
}

// Extract MongoDB ObjectIDs from text — 24-char hex strings
function extractMongoIds(text) {
  if (!text) return [];
  const regex = /\b([a-f0-9]{24})\b/gi;
  const matches = [...text.matchAll(regex)];
  return [...new Set(matches.map(m => m[1]))];
}

// Fetch full candidate profiles from Backend by IDs
async function fetchCandidatesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  try {
    const res = await axios.post(`${BACKEND_API}/api/v1/users/batch`, { ids });
    return res.data || [];
  } catch (err) {
    console.error('Failed to fetch candidate profiles:', err);
    return [];
  }
}

// Generate avatar colors
const avatarColors = [
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #22c55e, #06b6d4)',
  'linear-gradient(135deg, #ec4899, #a855f7)',
  'linear-gradient(135deg, #14b8a6, #3b82f6)',
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
}

function getColor(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// Mini candidate card for inline display
function MiniCandidateCard({ candidate }) {
  const initials = getInitials(candidate.fullName);
  const color = getColor(candidate.fullName);

  const stageColors = {
    'Applied': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
    'Round 1': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.2)' },
    'Round 2': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
    'Hired': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)' },
    'Rejected': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
  };
  const stageStyle = stageColors[candidate.applicationStage] || stageColors['Applied'];

  return (
    <motion.div
      className="aihub-candidate-card"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="aihub-cc-header">
        <div className="aihub-cc-avatar" style={{ background: color }}>
          {initials}
        </div>
        <div className="aihub-cc-info">
          <div className="aihub-cc-name">{candidate.fullName || 'Unknown'}</div>
          <div className="aihub-cc-email">
            <HiOutlineEnvelope size={12} /> {candidate.email || 'N/A'}
          </div>
        </div>
        {candidate.applicationStage && (
          <span
            className="aihub-cc-stage"
            style={{
              background: stageStyle.bg,
              color: stageStyle.color,
              border: `1px solid ${stageStyle.border}`,
            }}
          >
            {candidate.applicationStage}
          </span>
        )}
      </div>

      {/* Details Row */}
      <div className="aihub-cc-details">
        {candidate.applied_role && (
          <span className="aihub-cc-detail">
            <HiOutlineBriefcase size={12} />
            <span style={{ textTransform: 'capitalize' }}>{candidate.applied_role}</span>
          </span>
        )}
        {candidate.totalExperienceYears !== undefined && candidate.totalExperienceYears > 0 && (
          <span className="aihub-cc-detail">
            {candidate.totalExperienceYears} yrs exp
          </span>
        )}
        {candidate.location && candidate.location.city && (
          <span className="aihub-cc-detail">
            <HiOutlineMapPin size={12} />
            {candidate.location.city}{candidate.location.state ? `, ${candidate.location.state}` : ''}
          </span>
        )}
      </div>

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="aihub-cc-skills">
          {candidate.skills.slice(0, 6).map((skill, i) => (
            <span key={i} className="aihub-cc-skill">{skill}</span>
          ))}
          {candidate.skills.length > 6 && (
            <span className="aihub-cc-skill aihub-cc-more">+{candidate.skills.length - 6}</span>
          )}
        </div>
      )}

      {/* Education */}
      {candidate.education && candidate.education.length > 0 && (
        <div className="aihub-cc-edu">
          <HiOutlineAcademicCap size={12} />
          <span>{candidate.education[0].degree} — {candidate.education[0].institution}</span>
        </div>
      )}

      {/* AI Score if available */}
      {candidate._aiScore !== undefined && (
        <div className="aihub-cc-score">
          <span className="aihub-cc-score-label">Match</span>
          <span className="aihub-cc-score-value">{Math.round(candidate._aiScore * 100)}%</span>
        </div>
      )}
    </motion.div>
  );
}

export default function AiHubPanel({ open, onClose, initialMode = 'chat' }) {
  const [mode, setMode] = useState(initialMode);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = getSessionId();

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      inputRef.current?.focus();
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (open && messages.length === 0) {
      loadHistory();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${AI_API}/api/sessions/${sessionId}/history`);
      if (res.data.history && res.data.history.length > 0) {
        setMessages(res.data.history.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })));
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      role: 'user',
      content: mode === 'action' ? `⚡ ${userMsg}` : userMsg
    }]);
    setLoading(true);

    try {
      if (mode === 'action') {
        const res = await axios.post(`${AI_API}/api/actions/automated`, {
          command: userMsg,
          session_id: sessionId,
        });
        const data = res.data;

        let responseContent = data.summary || '';

        if (data.needs_clarification) {
          responseContent = `⚠️ ${data.clarification_question}\n\n`;
          if (data.ambiguous_matches) {
            data.ambiguous_matches.forEach(m => {
              responseContent += `• **${m.fullName}** — ${m.applied_role || 'N/A'} (${m.applicationStage || 'N/A'})\n  Use: "Move ${m.fullName} to Round 2"\n\n`;
            });
          }
        } else if (data.actions_executed && data.actions_executed.length > 0) {
          responseContent = data.actions_executed.map(act => {
            const icon = act.status === 'done' ? '✅' : '❌';
            const action = act.action?.replace(/_/g, ' ') || 'action';
            const extra = act.new_stage ? ` → ${act.new_stage}` : act.new_role ? ` → ${act.new_role}` : '';
            return `${icon} ${action}${extra}`;
          }).join('\n');
          if (data.summary) responseContent += `\n\n${data.summary}`;
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseContent,
          isAction: true,
          actionData: data,
        }]);

      } else {
        // AI Chat mode
        const res = await axios.post(`${AI_API}/api/chat`, {
          session_id: sessionId,
          message: userMsg,
        });
        const data = res.data;
        const responseText = data.response || 'No response received.';

        // Check if the response includes candidate IDs
        let candidateIds = [];

        // 1. From structured results
        if (data.results && data.results.ids && data.results.ids.length > 0) {
          candidateIds = data.results.ids;
        }

        // 2. Fallback: extract from response text
        if (candidateIds.length === 0) {
          candidateIds = extractMongoIds(responseText);
        }

        // Fetch full candidate profiles if IDs found
        let candidates = [];
        if (candidateIds.length > 0) {
          candidates = await fetchCandidatesByIds(candidateIds);

          // Attach AI score if available from results items
          if (data.results && data.results.items) {
            const scoreMap = {};
            data.results.items.forEach(item => {
              if (item.mongo_id && item.score) {
                scoreMap[item.mongo_id] = item.score;
              }
            });
            candidates = candidates.map(c => ({
              ...c,
              _aiScore: scoreMap[c._id] || scoreMap[String(c._id)] || undefined,
            }));
          }
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseText,
          candidates: candidates.length > 0 ? candidates : null,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Failed to process your request. Please try again.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete(`${AI_API}/api/sessions/${sessionId}/clear`);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history');
    }
  };

  const formatContent = (content) => {
    if (!content) return '';
    // Remove raw [ID: xxxx] patterns since we're showing cards instead
    let cleaned = content.replace(/\[ID:\s*[a-f0-9]{24}\]/gi, '');
    return cleaned
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const suggestions = mode === 'action' ? [
    'Move Rahul to Round 2',
    'Hire Priya Sharma',
    'Reject candidate in Round 1',
  ] : [
    'Find top React developers',
    'Compare all shortlisted candidates',
    'Who has 3+ years of Python experience?',
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="aihub-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="aihub-panel"
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="aihub-header">
              <div className="aihub-header-left">
                <div className="aihub-header-icon">
                  <HiOutlineCpuChip size={22} />
                </div>
                <div>
                  <h2 className="aihub-header-title">TalentMind AI</h2>
                  <span className="aihub-header-subtitle">Your intelligent assistant</span>
                </div>
              </div>
              <div className="aihub-header-actions">
                <button className="aihub-header-btn" title="Clear conversation" onClick={handleClearHistory}>
                  <HiOutlineTrash size={16} />
                </button>
                <button className="aihub-header-btn aihub-close-btn" onClick={onClose}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="aihub-mode-switcher">
              <button
                className={`aihub-mode-tab ${mode === 'chat' ? 'active' : ''}`}
                onClick={() => setMode('chat')}
              >
                <HiOutlineChatBubbleLeftRight size={16} />
                <span>AI Chat</span>
                <div className="aihub-mode-glow" />
              </button>
              <button
                className={`aihub-mode-tab aihub-mode-action ${mode === 'action' ? 'active' : ''}`}
                onClick={() => setMode('action')}
              >
                <HiOutlineCommandLine size={16} />
                <span>AI Actions</span>
                <div className="aihub-mode-glow" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="aihub-messages">
              {loadingHistory ? (
                <div className="aihub-loading">
                  <div className="aihub-loading-spinner" />
                  <span>Loading conversation...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="aihub-empty">
                  <div className="aihub-empty-orb">
                    {mode === 'action' ? <HiOutlineCommandLine size={36} /> : <HiOutlineSparkles size={36} />}
                  </div>
                  <h3 className="aihub-empty-title">
                    {mode === 'action' ? 'Command Center' : 'Ask me anything'}
                  </h3>
                  <p className="aihub-empty-desc">
                    {mode === 'action'
                      ? 'Execute commands to manage candidates, update stages, and automate workflows.'
                      : 'Search candidates, get AI insights, compare profiles, and discover talent.'}
                  </p>
                  <div className="aihub-suggestions">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="aihub-suggestion-chip"
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      >
                        {mode === 'action' ? <HiOutlineBolt size={12} /> : <HiOutlineSparkles size={12} />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`aihub-msg aihub-msg-${msg.role}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <div className="aihub-msg-avatar">
                      {msg.role === 'user' ? <HiOutlineUser size={15} /> : <HiOutlineCpuChip size={15} />}
                    </div>
                    <div className="aihub-msg-content-wrap">
                      <div className={`aihub-msg-bubble ${msg.isAction ? 'aihub-msg-action-bubble' : ''} ${msg.isError ? 'aihub-msg-error-bubble' : ''}`}>
                        <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                      </div>

                      {/* Candidate Cards */}
                      {msg.candidates && msg.candidates.length > 0 && (
                        <div className="aihub-candidates-list">
                          <div className="aihub-candidates-header">
                            <HiOutlineUser size={14} />
                            <span>{msg.candidates.length} Candidate{msg.candidates.length > 1 ? 's' : ''} Found</span>
                          </div>
                          {msg.candidates.map((candidate, ci) => (
                            <MiniCandidateCard key={candidate._id || ci} candidate={candidate} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {loading && (
                <div className="aihub-msg aihub-msg-assistant">
                  <div className="aihub-msg-avatar"><HiOutlineCpuChip size={15} /></div>
                  <div className="aihub-msg-bubble aihub-msg-typing">
                    <span className="aihub-typing-dot" />
                    <span className="aihub-typing-dot" />
                    <span className="aihub-typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="aihub-input-area">
              <div className={`aihub-input-bar ${mode === 'action' ? 'aihub-input-action' : ''}`}>
                <div className="aihub-input-icon">
                  {mode === 'action' ? <HiOutlineBolt size={18} /> : <HiOutlineSparkles size={18} />}
                </div>
                <input
                  ref={inputRef}
                  className="aihub-input"
                  placeholder={mode === 'action'
                    ? 'Type a command... e.g. "Move Rahul to Round 2"'
                    : 'Ask AI... e.g. "Find top React devs"'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={loading}
                />
                <button
                  className={`aihub-send-btn ${mode === 'action' ? 'aihub-send-action' : ''}`}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                >
                  <HiOutlinePaperAirplane size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
