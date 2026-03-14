import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AiHub.css';

const AI_BASE = 'http://localhost:5001';
const BACKEND_API = 'http://localhost:8080';

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

// Format content: clean IDs and render basic markdown
function formatContent(content) {
  if (!content) return '';
  // Remove raw [ID: xxxx] patterns since we show cards instead
  let cleaned = content.replace(/\[ID:\s*[a-f0-9]{24}\]/gi, '');
  // Clean up standalone 24-char hex IDs that look like raw ObjectIDs
  cleaned = cleaned.replace(/\b[a-f0-9]{24}\b/gi, (match) => {
    return '';
  });
  // Clean up extra whitespace from removals
  cleaned = cleaned.replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n');
  return cleaned
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

// Avatar colors for candidate cards
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

function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// Map stage to CSS class
function getStageClass(stage) {
  const map = {
    'Applied': 'aihub-stage--applied',
    'Round 1': 'aihub-stage--round1',
    'Round 2': 'aihub-stage--round2',
    'Hired': 'aihub-stage--hired',
    'Rejected': 'aihub-stage--rejected',
  };
  return map[stage] || 'aihub-stage--applied';
}

// ──────────────────────────────────────────────
// Candidate Card Component
// ──────────────────────────────────────────────
function CandidateCard({ candidate }) {
  const initials = getInitials(candidate.fullName);
  const color = getAvatarColor(candidate.fullName);
  const stage = candidate.applicationStage || 'Applied';
  const scorePercent = candidate._aiScore !== undefined ? Math.round(candidate._aiScore * 100) : null;

  return (
    <div className="aihub-ccard">
      {/* Header: Avatar + Name + Stage */}
      <div className="aihub-ccard-header">
        <div className="aihub-ccard-avatar" style={{ background: color }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="aihub-ccard-name">{candidate.fullName || 'Unknown'}</p>
          <p className="aihub-ccard-email">
            ✉️ {candidate.email || 'N/A'}
            {candidate.phone && <span> &nbsp;·&nbsp; 📞 {candidate.phone}</span>}
          </p>
        </div>
        <span className={`aihub-ccard-stage ${getStageClass(stage)}`}>{stage}</span>
      </div>

      {/* Details Row */}
      <div className="aihub-ccard-details">
        {candidate.applied_role && (
          <span className="aihub-ccard-detail">
            <span className="aihub-ccard-detail-icon">💼</span>
            <span style={{ textTransform: 'capitalize' }}>{candidate.applied_role}</span>
          </span>
        )}
        {candidate.totalExperienceYears > 0 && (
          <span className="aihub-ccard-detail">
            <span className="aihub-ccard-detail-icon">⏳</span>
            {candidate.totalExperienceYears} yrs exp
          </span>
        )}
        {candidate.location && (candidate.location.city || candidate.location.state) && (
          <span className="aihub-ccard-detail">
            <span className="aihub-ccard-detail-icon">📍</span>
            {candidate.location.city}{candidate.location.state ? `, ${candidate.location.state}` : ''}
          </span>
        )}
      </div>

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="aihub-ccard-skills">
          {candidate.skills.slice(0, 6).map((skill, i) => (
            <span key={i} className="aihub-ccard-skill">{skill}</span>
          ))}
          {candidate.skills.length > 6 && (
            <span className="aihub-ccard-skill aihub-ccard-skill--more">+{candidate.skills.length - 6}</span>
          )}
        </div>
      )}

      {/* Education */}
      {candidate.education && candidate.education.length > 0 && (
        <div className="aihub-ccard-edu">
          <span className="aihub-ccard-edu-icon">🎓</span>
          <span>
            {candidate.education[0].degree}
            {candidate.education[0].institution && ` — ${candidate.education[0].institution}`}
            {candidate.education[0].score && ` (${candidate.education[0].score})`}
          </span>
        </div>
      )}

      {/* Experience */}
      {candidate.experience && candidate.experience.length > 0 && (
        <div className="aihub-ccard-exp">
          <span className="aihub-ccard-exp-icon">🏢</span>
          <span>
            {candidate.experience[0].role}
            {candidate.experience[0].company && ` at ${candidate.experience[0].company}`}
            {candidate.experience[0].years_worked && ` (${candidate.experience[0].years_worked} yrs)`}
            {candidate.experience.length > 1 && (
              <span className="aihub-ccard-more"> + {candidate.experience.length - 1} more</span>
            )}
          </span>
        </div>
      )}

      {/* AI Match Score */}
      {scorePercent !== null && (
        <div className="aihub-ccard-score">
          <span className="aihub-ccard-score-label">Match: {scorePercent}%</span>
          <div className="aihub-ccard-score-bar">
            <div className="aihub-ccard-score-fill" style={{ width: `${scorePercent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main AiHub Page
// ──────────────────────────────────────────────
const AiHub = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'actions'

  // --- CHAT STATE ---
  const [sessionId] = useState('s_' + Math.random().toString(36).substring(2, 9));
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- ACTIONS STATE ---
  const [actionInput, setActionInput] = useState('');
  const [actionSessionId] = useState('action_' + Math.random().toString(36).substring(2, 9));
  const [actionResults, setActionResults] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- CHAT HANDLER ---
  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg) return;

    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await axios.post(`${AI_BASE}/api/chat`, {
        session_id: sessionId,
        message: msg
      });

      const data = res.data;
      let reply = '';

      if (data.response) {
        reply = typeof data.response === 'string' ? data.response : JSON.stringify(data.response, null, 2);
      } else if (data.result) {
        reply = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
      } else {
        reply = JSON.stringify(data, null, 2);
      }

      // ──── Extract candidate IDs from the response ────
      let candidateIds = [];

      // 1. From structured results (chat_engine returns results.ids)
      if (data.results && data.results.ids && data.results.ids.length > 0) {
        candidateIds = data.results.ids;
      }

      // 2. Fallback: extract from response text
      if (candidateIds.length === 0) {
        candidateIds = extractMongoIds(reply);
      }

      // ──── Fetch full candidate profiles if IDs found ────
      let candidates = [];
      if (candidateIds.length > 0) {
        candidates = await fetchCandidatesByIds(candidateIds);

        // Attach AI score if available from results items
        if (data.results && data.results.items && data.results.items.length > 0) {
          const scoreMap = {};
          data.results.items.forEach(item => {
            if (item.mongo_id && item.score !== undefined) {
              scoreMap[item.mongo_id] = item.score;
            }
          });
          candidates = candidates.map(c => ({
            ...c,
            _aiScore: scoreMap[c._id] || scoreMap[String(c._id)] || undefined,
          }));
        }
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        candidates: candidates.length > 0 ? candidates : null,
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- ACTION HANDLER ---
  const handleActionSend = async () => {
    const cmd = actionInput.trim();
    if (!cmd) return;

    setActionResults(prev => [...prev, { type: 'command', text: cmd }]);
    setActionInput('');
    setIsActionLoading(true);

    try {
      const res = await axios.post(`${AI_BASE}/api/actions/automated`, {
        command: cmd,
        session_id: actionSessionId
      });

      const data = res.data;

      if (data.needs_clarification) {
        setActionResults(prev => [...prev, {
          type: 'clarification',
          question: data.clarification_question,
          matches: data.ambiguous_matches || []
        }]);
      } else if (data.actions_executed && data.actions_executed.length > 0) {
        setActionResults(prev => [...prev, {
          type: 'result',
          summary: data.summary || '',
          actions: data.actions_executed
        }]);
      } else {
        setActionResults(prev => [...prev, {
          type: 'result',
          summary: data.summary || data.error || 'No actions executed.',
          actions: []
        }]);
      }
    } catch (err) {
      console.error('Action error:', err);
      const errMsg = err.response?.data?.summary || err.response?.data?.error || 'Action failed. Check if the AI Chat-Bot is running on port 5001.';
      setActionResults(prev => [...prev, { type: 'error', text: errMsg }]);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="aihub-page">
      <Navbar />
      <main className="aihub-main">
        {/* Header */}
        <div className="aihub-page-header">
          <h1 className="aihub-page-title">AI Hub</h1>
          <p className="aihub-page-subtitle">Chat with AI or execute recruiter actions using natural language.</p>
        </div>

        {/* Tab Bar */}
        <div className="aihub-tabs">
          <button
            className={`aihub-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="aihub-tab-icon">✨</span>
            AI Chat
          </button>
          <button
            className={`aihub-tab ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            <span className="aihub-tab-icon">⚡</span>
            AI Actions
          </button>
        </div>

        {/* ═══════ CHAT TAB ═══════ */}
        {activeTab === 'chat' && (
          <div className="aihub-chat-window">
            <div className="aihub-messages">
              <div className="aihub-msg-column">
                {chatMessages.length === 0 && (
                  <div className="aihub-empty">
                    <div className="aihub-empty-icon">✨</div>
                    <h3>Ask me anything</h3>
                    <p>Search candidates, compare skills, get AI insights, and discover top talent in your pipeline.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`aihub-msg-wrap ${msg.role === 'user' ? 'aihub-msg-wrap--user' : 'aihub-msg-wrap--assistant'}`}
                  >
                    {/* Message Bubble */}
                    {msg.role === 'user' ? (
                      <div className="aihub-bubble aihub-bubble--user">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="aihub-bubble aihub-bubble--assistant">
                        <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                      </div>
                    )}

                    {/* Candidate Cards — rendered below assistant messages */}
                    {msg.candidates && msg.candidates.length > 0 && (
                      <div className="aihub-candidates-wrap">
                        <div className="aihub-candidates-label">
                          <span className="aihub-candidates-label-icon">👤</span>
                          {msg.candidates.length} Candidate{msg.candidates.length > 1 ? 's' : ''} Found
                        </div>
                        {msg.candidates.map((candidate, ci) => (
                          <CandidateCard key={candidate._id || ci} candidate={candidate} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isChatLoading && (
                  <div className="aihub-typing">
                    <span className="aihub-typing-dot" />
                    <span className="aihub-typing-dot" />
                    <span className="aihub-typing-dot" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="aihub-input-area">
              <input
                className="aihub-input"
                placeholder="Ask about candidates, skills, comparisons..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isChatLoading && handleChatSend()}
                disabled={isChatLoading}
              />
              <button className="aihub-send" onClick={handleChatSend} disabled={!chatInput.trim() || isChatLoading}>
                <span>{isChatLoading ? '...' : 'Send'}</span>
                <span className="aihub-send-icon">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════ ACTIONS TAB ═══════ */}
        {activeTab === 'actions' && (
          <div className="aihub-chat-window">
            <div className="aihub-messages">
              {actionResults.length === 0 && (
                <div className="aihub-empty">
                  <div className="aihub-empty-icon">⚡</div>
                  <h3>Command Center</h3>
                  <p>Execute recruiter actions with natural language — move candidates, update stages, and automate workflows.</p>
                </div>
              )}
              {actionResults.map((item, i) => {
                if (item.type === 'command') {
                  return (
                    <div key={i} className="aihub-action-command">
                      <div className="aihub-action-command-label">You</div>
                      {item.text}
                    </div>
                  );
                }
                if (item.type === 'error') {
                  return (
                    <div key={i} className="aihub-action-card aihub-action-card--error">
                      <pre className="aihub-action-text">{item.text}</pre>
                    </div>
                  );
                }
                if (item.type === 'clarification') {
                  return (
                    <div key={i} className="aihub-action-card">
                      <p className="aihub-action-clarify-q">{item.question}</p>
                      {item.matches.map((m, j) => (
                        <p key={j} className="aihub-action-clarify-match">
                          {m.fullName} — {m.applied_role} ({m.applicationStage}) [ID: {m.mongo_id}]
                        </p>
                      ))}
                      <p className="aihub-action-clarify-tip">Tip: Re-send with the candidate's full name or ID to resolve.</p>
                    </div>
                  );
                }
                // type === 'result'
                return (
                  <div key={i} className="aihub-action-card">
                    <pre className="aihub-action-text">{item.summary}</pre>
                  </div>
                );
              })}
              {isActionLoading && (
                <div className="aihub-typing">
                  <span className="aihub-typing-dot" />
                  <span className="aihub-typing-dot" />
                  <span className="aihub-typing-dot" />
                </div>
              )}
            </div>

            {/* Action Input */}
            <div className="aihub-input-area">
              <input
                className="aihub-input"
                placeholder='e.g. "Move Priya Sharma to Round 2"'
                value={actionInput}
                onChange={e => setActionInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isActionLoading && handleActionSend()}
                disabled={isActionLoading}
              />
              <button className="aihub-send" onClick={handleActionSend} disabled={!actionInput.trim() || isActionLoading}>
                <span>{isActionLoading ? '...' : 'Execute'}</span>
                <span className="aihub-send-icon">→</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AiHub;
