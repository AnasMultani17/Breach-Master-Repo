import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './ComparePage.css';

const BACKEND_API = 'http://localhost:8080';
const AI_BASE = 'http://localhost:5001';

// Avatar helpers (reused from AiHub pattern)
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

function getStageClass(stage) {
  const map = {
    'Applied': 'cmp-stage--applied',
    'Round 1': 'cmp-stage--round1',
    'Round 2': 'cmp-stage--round2',
    'Hired': 'cmp-stage--hired',
    'Rejected': 'cmp-stage--rejected',
  };
  return map[stage] || 'cmp-stage--applied';
}

// Format AI response markdown to html
function formatAiContent(content) {
  if (!content) return '';
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

const ComparePage = () => {
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  const [error1, setError1] = useState('');
  const [error2, setError2] = useState('');
  const [candidate1, setCandidate1] = useState(null);
  const [candidate2, setCandidate2] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);

  // AI verdict
  const [aiVerdict, setAiVerdict] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Look up a candidate by email from all resumes
  const findCandidateByEmail = async (email) => {
    const res = await axios.get(`${BACKEND_API}/api/v1/users/resumes`);
    const all = res.data || [];
    return all.find(c => c.email && c.email.toLowerCase() === email.toLowerCase()) || null;
  };

  // Main compare handler
  const handleCompare = async () => {
    setError1('');
    setError2('');
    setCandidate1(null);
    setCandidate2(null);
    setAiVerdict('');
    setHasCompared(false);

    // Validate emails
    const trimmed1 = email1.trim().toLowerCase();
    const trimmed2 = email2.trim().toLowerCase();

    if (!trimmed1) { setError1('Please enter an email address.'); return; }
    if (!isValidEmail(trimmed1)) { setError1('Invalid email format.'); return; }
    if (!trimmed2) { setError2('Please enter an email address.'); return; }
    if (!isValidEmail(trimmed2)) { setError2('Invalid email format.'); return; }
    if (trimmed1 === trimmed2) { setError2('Both emails are the same. Enter two different candidates.'); return; }

    setIsLoading(true);

    try {
      // Fetch all resumes once
      const res = await axios.get(`${BACKEND_API}/api/v1/users/resumes`);
      const all = res.data || [];

      const found1 = all.find(c => c.email && c.email.toLowerCase() === trimmed1);
      const found2 = all.find(c => c.email && c.email.toLowerCase() === trimmed2);

      let hasError = false;
      if (!found1) { setError1(`No candidate found with email "${trimmed1}".`); hasError = true; }
      if (!found2) { setError2(`No candidate found with email "${trimmed2}".`); hasError = true; }

      if (hasError) { setIsLoading(false); return; }

      setCandidate1(found1);
      setCandidate2(found2);
      setHasCompared(true);
      setIsLoading(false);

      // Fire AI comparison
      fetchAiVerdict(found1, found2);
    } catch (err) {
      console.error('Compare error:', err);
      setError1('Failed to fetch candidates. Is the backend running?');
      setIsLoading(false);
    }
  };

  // Get AI comparison verdict
  const fetchAiVerdict = async (c1, c2) => {
    setIsAiLoading(true);
    try {
      const sessionId = 'compare_' + Math.random().toString(36).substring(2, 9);
      const prompt = `Compare these two candidates side by side and give a brief professional verdict on who would be a stronger hire and why. Be specific about their strengths and weaknesses.

Candidate A: ${c1.fullName}
- Email: ${c1.email}
- Role Applied: ${c1.applied_role || 'N/A'}
- Experience: ${c1.totalExperienceYears || 0} years
- Skills: ${(c1.skills || []).join(', ') || 'N/A'}
- Education: ${c1.education && c1.education.length > 0 ? c1.education.map(e => `${e.degree} from ${e.institution}`).join('; ') : 'N/A'}
- Latest Role: ${c1.experience && c1.experience.length > 0 ? `${c1.experience[0].role} at ${c1.experience[0].company}` : 'N/A'}
- Stage: ${c1.applicationStage || 'Applied'}

Candidate B: ${c2.fullName}
- Email: ${c2.email}
- Role Applied: ${c2.applied_role || 'N/A'}
- Experience: ${c2.totalExperienceYears || 0} years
- Skills: ${(c2.skills || []).join(', ') || 'N/A'}
- Education: ${c2.education && c2.education.length > 0 ? c2.education.map(e => `${e.degree} from ${e.institution}`).join('; ') : 'N/A'}
- Latest Role: ${c2.experience && c2.experience.length > 0 ? `${c2.experience[0].role} at ${c2.experience[0].company}` : 'N/A'}
- Stage: ${c2.applicationStage || 'Applied'}`;

      const aiRes = await axios.post(`${AI_BASE}/api/chat`, {
        session_id: sessionId,
        message: prompt
      });

      const data = aiRes.data;
      let reply = data.response || data.result || JSON.stringify(data, null, 2);
      if (typeof reply !== 'string') reply = JSON.stringify(reply, null, 2);

      setAiVerdict(reply);
    } catch (err) {
      console.error('AI verdict error:', err);
      setAiVerdict('AI comparison unavailable — the AI service may not be running.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Compute comparison data
  const buildComparisonRows = (c1, c2) => {
    if (!c1 || !c2) return [];

    const skills1 = new Set((c1.skills || []).map(s => s.toLowerCase()));
    const skills2 = new Set((c2.skills || []).map(s => s.toLowerCase()));
    const commonSkills = [...skills1].filter(s => skills2.has(s));

    return [
      { label: 'Full Name', val1: c1.fullName || 'N/A', val2: c2.fullName || 'N/A' },
      { label: 'Email', val1: c1.email || 'N/A', val2: c2.email || 'N/A' },
      { label: 'Applied Role', val1: c1.applied_role || 'N/A', val2: c2.applied_role || 'N/A', capitalize: true },
      { label: 'Pipeline Stage', val1: c1.applicationStage || 'N/A', val2: c2.applicationStage || 'N/A' },
      {
        label: 'Experience',
        val1: `${c1.totalExperienceYears || 0} years`,
        val2: `${c2.totalExperienceYears || 0} years`,
        winner: (c1.totalExperienceYears || 0) > (c2.totalExperienceYears || 0) ? 1 : (c2.totalExperienceYears || 0) > (c1.totalExperienceYears || 0) ? 2 : 0
      },
      {
        label: 'Total Skills',
        val1: `${(c1.skills || []).length} skills`,
        val2: `${(c2.skills || []).length} skills`,
        winner: (c1.skills || []).length > (c2.skills || []).length ? 1 : (c2.skills || []).length > (c1.skills || []).length ? 2 : 0
      },
      { label: 'Common Skills', val1: commonSkills.length > 0 ? commonSkills.join(', ') : 'None', val2: commonSkills.length > 0 ? commonSkills.join(', ') : 'None' },
      { label: 'Location', val1: c1.location ? `${c1.location.city || ''}${c1.location.state ? ', ' + c1.location.state : ''}` : 'N/A', val2: c2.location ? `${c2.location.city || ''}${c2.location.state ? ', ' + c2.location.state : ''}` : 'N/A' },
      {
        label: 'Education',
        val1: c1.education && c1.education.length > 0 ? c1.education.map(e => `${e.degree}${e.institution ? ' — ' + e.institution : ''}`).join('; ') : 'N/A',
        val2: c2.education && c2.education.length > 0 ? c2.education.map(e => `${e.degree}${e.institution ? ' — ' + e.institution : ''}`).join('; ') : 'N/A'
      },
      {
        label: 'Latest Role',
        val1: c1.experience && c1.experience.length > 0 ? `${c1.experience[0].role || ''}${c1.experience[0].company ? ' at ' + c1.experience[0].company : ''}` : 'N/A',
        val2: c2.experience && c2.experience.length > 0 ? `${c2.experience[0].role || ''}${c2.experience[0].company ? ' at ' + c2.experience[0].company : ''}` : 'N/A'
      },
    ];
  };

  // Render skills with shared/unique highlighting
  const renderSkillsComparison = (skills, otherSkills) => {
    if (!skills || skills.length === 0) return <span style={{ color: 'var(--text-muted)' }}>No skills listed</span>;
    const otherSet = new Set((otherSkills || []).map(s => s.toLowerCase()));
    return skills.map((skill, i) => {
      const isShared = otherSet.has(skill.toLowerCase());
      return (
        <span key={i} className={`cmp-skill-inline ${isShared ? 'cmp-skill-inline--match' : 'cmp-skill-inline--unique'}`}>
          {skill}
        </span>
      );
    });
  };

  const bothEmailsFilled = email1.trim() && email2.trim();
  const comparisonRows = buildComparisonRows(candidate1, candidate2);

  return (
    <div className="cmp-page">
      <Navbar />
      <main className="cmp-main">
        <h1 className="cmp-page-title">Compare Candidates</h1>
        <p className="cmp-page-subtitle">Enter two candidate email addresses to get a side-by-side comparison with AI-powered analysis.</p>

        {/* Email Input Row */}
        <div className="cmp-input-row">
          <div className="cmp-input-group">
            <label className="cmp-input-label">Candidate A — Email</label>
            <input
              className={`cmp-input${error1 ? ' error' : ''}`}
              type="email"
              placeholder="e.g. john@example.com"
              value={email1}
              onChange={e => { setEmail1(e.target.value); setError1(''); }}
              onKeyDown={e => e.key === 'Enter' && bothEmailsFilled && handleCompare()}
            />
            {error1 && <div className="cmp-input-error">{error1}</div>}
          </div>

          <div className="cmp-input-group">
            <label className="cmp-input-label">Candidate B — Email</label>
            <input
              className={`cmp-input${error2 ? ' error' : ''}`}
              type="email"
              placeholder="e.g. jane@example.com"
              value={email2}
              onChange={e => { setEmail2(e.target.value); setError2(''); }}
              onKeyDown={e => e.key === 'Enter' && bothEmailsFilled && handleCompare()}
            />
            {error2 && <div className="cmp-input-error">{error2}</div>}
          </div>

          <button
            className="cmp-compare-btn"
            onClick={handleCompare}
            disabled={!bothEmailsFilled || isLoading}
          >
            {isLoading ? 'Searching...' : 'Compare'}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="cmp-loading">
            <div className="cmp-loading-spinner" />
            <div className="cmp-loading-text">Looking up candidates...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasCompared && (
          <div className="cmp-empty">
            <span className="cmp-empty-icon">⚖️</span>
            <div className="cmp-empty-title">Ready to Compare</div>
            <div className="cmp-empty-desc">Enter two candidate emails above and hit Compare to see a detailed side-by-side breakdown with AI analysis.</div>
          </div>
        )}

        {/* Comparison Results */}
        {hasCompared && candidate1 && candidate2 && (
          <div className="cmp-versus">
            {/* VS Header */}
            <div className="cmp-versus-header">
              <div className="cmp-vs-name">{candidate1.fullName}</div>
              <div className="cmp-vs-badge">VS</div>
              <div className="cmp-vs-name">{candidate2.fullName}</div>
            </div>

            {/* Side-by-side Cards */}
            <div className="cmp-cards-row">
              {/* Candidate A Card */}
              <div className="cmp-ccard cmp-ccard--a">
                <div className="cmp-ccard-header">
                  <div className="cmp-ccard-avatar" style={{ background: getAvatarColor(candidate1.fullName) }}>
                    {getInitials(candidate1.fullName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cmp-ccard-name">{candidate1.fullName}</div>
                    <div className="cmp-ccard-email">{candidate1.email}</div>
                  </div>
                  <span className={`cmp-ccard-stage ${getStageClass(candidate1.applicationStage)}`}>
                    {candidate1.applicationStage || 'Applied'}
                  </span>
                </div>
                <div className="cmp-ccard-details">
                  {candidate1.applied_role && (
                    <div className="cmp-ccard-detail-row">
                      <span className="cmp-ccard-detail-icon">💼</span>
                      <span className="cmp-ccard-detail-label">Role</span>
                      <span style={{ textTransform: 'capitalize' }}>{candidate1.applied_role}</span>
                    </div>
                  )}
                  <div className="cmp-ccard-detail-row">
                    <span className="cmp-ccard-detail-icon">⏳</span>
                    <span className="cmp-ccard-detail-label">Experience</span>
                    <span>{candidate1.totalExperienceYears || 0} years</span>
                  </div>
                  {candidate1.location && (
                    <div className="cmp-ccard-detail-row">
                      <span className="cmp-ccard-detail-icon">📍</span>
                      <span className="cmp-ccard-detail-label">Location</span>
                      <span>{candidate1.location.city}{candidate1.location.state ? `, ${candidate1.location.state}` : ''}</span>
                    </div>
                  )}
                </div>
                <div className="cmp-ccard-skills">
                  {renderSkillsComparison(candidate1.skills, candidate2.skills)}
                </div>
              </div>

              {/* Candidate B Card */}
              <div className="cmp-ccard cmp-ccard--b">
                <div className="cmp-ccard-header">
                  <div className="cmp-ccard-avatar" style={{ background: getAvatarColor(candidate2.fullName) }}>
                    {getInitials(candidate2.fullName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cmp-ccard-name">{candidate2.fullName}</div>
                    <div className="cmp-ccard-email">{candidate2.email}</div>
                  </div>
                  <span className={`cmp-ccard-stage ${getStageClass(candidate2.applicationStage)}`}>
                    {candidate2.applicationStage || 'Applied'}
                  </span>
                </div>
                <div className="cmp-ccard-details">
                  {candidate2.applied_role && (
                    <div className="cmp-ccard-detail-row">
                      <span className="cmp-ccard-detail-icon">💼</span>
                      <span className="cmp-ccard-detail-label">Role</span>
                      <span style={{ textTransform: 'capitalize' }}>{candidate2.applied_role}</span>
                    </div>
                  )}
                  <div className="cmp-ccard-detail-row">
                    <span className="cmp-ccard-detail-icon">⏳</span>
                    <span className="cmp-ccard-detail-label">Experience</span>
                    <span>{candidate2.totalExperienceYears || 0} years</span>
                  </div>
                  {candidate2.location && (
                    <div className="cmp-ccard-detail-row">
                      <span className="cmp-ccard-detail-icon">📍</span>
                      <span className="cmp-ccard-detail-label">Location</span>
                      <span>{candidate2.location.city}{candidate2.location.state ? `, ${candidate2.location.state}` : ''}</span>
                    </div>
                  )}
                </div>
                <div className="cmp-ccard-skills">
                  {renderSkillsComparison(candidate2.skills, candidate1.skills)}
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="cmp-table-section">
              <div className="cmp-table-title">Detailed Comparison</div>
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>{candidate1.fullName}</th>
                    <th>{candidate2.fullName}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.label}</td>
                      <td
                        className={row.winner === 1 ? 'cmp-winner-cell' : ''}
                        style={row.capitalize ? { textTransform: 'capitalize' } : undefined}
                      >
                        {row.val1}
                      </td>
                      <td
                        className={row.winner === 2 ? 'cmp-winner-cell' : ''}
                        style={row.capitalize ? { textTransform: 'capitalize' } : undefined}
                      >
                        {row.val2}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Verdict */}
            <div className="cmp-ai-section">
              <div className="cmp-ai-title">
                <span className="cmp-ai-title-icon">✨</span>
                AI Verdict
              </div>
              {isAiLoading ? (
                <div className="cmp-ai-loading">
                  <div className="cmp-ai-loading-dots">
                    <span className="cmp-ai-loading-dot" />
                    <span className="cmp-ai-loading-dot" />
                    <span className="cmp-ai-loading-dot" />
                  </div>
                  <span>AI is analyzing both candidates...</span>
                </div>
              ) : aiVerdict ? (
                <div className="cmp-ai-body" dangerouslySetInnerHTML={{ __html: formatAiContent(aiVerdict) }} />
              ) : (
                <div className="cmp-ai-loading">
                  <span>Waiting for AI analysis...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComparePage;
