import { motion } from 'framer-motion';
import { HiOutlineEnvelope, HiOutlineMapPin, HiOutlineBriefcase, HiOutlineDocument } from 'react-icons/hi2';
import './CandidateCard.css';

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

export default function CandidateCard({ candidate, actions, aiBadge, aiScore, index = 0 }) {
  const initials = getInitials(candidate.fullName);
  const color = getColor(candidate.fullName);

  return (
    <motion.div
      className="ccard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* Header */}
      <div className="ccard-header">
        <div className="ccard-avatar" style={{ background: color }}>
          {initials}
        </div>
        <div className="ccard-info">
          <h3 className="ccard-name">{candidate.fullName || 'Unknown'}</h3>
          <div className="ccard-meta">
            <span><HiOutlineEnvelope size={14} /> {candidate.email || 'N/A'}</span>
            {candidate.location && (
              <span><HiOutlineMapPin size={14} /> {candidate.location.city}{candidate.location.state ? `, ${candidate.location.state}` : ''}</span>
            )}
          </div>
        </div>
        {aiBadge && <div className="ccard-ai-badge">{aiBadge}</div>}
        {aiScore !== undefined && (
          <div className="ccard-ai-score">
            <span className="ccard-ai-score-value">{aiScore}</span>
            <span className="ccard-ai-score-label">/100</span>
          </div>
        )}
      </div>

      {/* Role & Experience */}
      <div className="ccard-role-row">
        {candidate.applied_role && (
          <span className="badge badge-ai" style={{ textTransform: 'capitalize' }}>
            <HiOutlineBriefcase size={12} /> {candidate.applied_role}
          </span>
        )}
        {candidate.totalExperienceYears !== undefined && (
          <span className="ccard-exp">{candidate.totalExperienceYears} yrs exp</span>
        )}
        {candidate.applicationStage && (
          <span className={`badge badge-stage badge-stage-${candidate.applicationStage.toLowerCase().replace(/\s/g, '')}`}>
            {candidate.applicationStage}
          </span>
        )}
      </div>

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="ccard-skills">
          {candidate.skills.slice(0, 8).map((skill, i) => (
            <span key={i} className="badge badge-skill">{skill}</span>
          ))}
          {candidate.skills.length > 8 && (
            <span className="ccard-more-skills">+{candidate.skills.length - 8}</span>
          )}
        </div>
      )}

      {/* Source & Resume */}
      <div className="ccard-footer">
        <div className="ccard-source">
          {candidate.sourcePlatforms && candidate.sourcePlatforms.map((s, i) => (
            <span key={i} className="ccard-source-badge">{s.replace(/_/g, ' ')}</span>
          ))}
        </div>
        {candidate.originalResumeUrls && candidate.originalResumeUrls.length > 0 && (
          <a
            href={candidate.originalResumeUrls[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="ccard-resume-link"
          >
            <HiOutlineDocument size={14} /> Resume
          </a>
        )}
      </div>

      {/* AI Reason */}
      {candidate._aiReason && (
        <div className="ccard-ai-reason">
          <span className="ccard-ai-reason-label">🤖 AI Insight:</span> {candidate._aiReason}
        </div>
      )}

      {/* Actions */}
      {actions && <div className="ccard-actions">{actions}</div>}
    </motion.div>
  );
}
