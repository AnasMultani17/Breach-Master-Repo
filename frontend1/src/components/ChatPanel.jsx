import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineChatBubbleLeftRight, HiOutlineXMark, HiOutlinePaperAirplane,
  HiOutlineBolt, HiOutlineSparkles, HiOutlineTrash, HiOutlineUser,
  HiOutlineCpuChip
} from 'react-icons/hi2';
import './ChatPanel.css';

const AI_API = 'http://localhost:5001';

function getSessionId() {
  let sid = localStorage.getItem('talentmind_session');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('talentmind_session', sid);
  }
  return sid;
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat' | 'action'
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = getSessionId();

  // Load history when panel opens
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

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: mode === 'action' ? `[ACTION] ${userMsg}` : userMsg }]);
    setLoading(true);

    try {
      if (mode === 'action') {
        const res = await axios.post(`${AI_API}/api/actions/automated`, {
          command: userMsg,
          session_id: sessionId,
        });
        const data = res.data;

        // Build response message
        let responseContent = data.summary || '';

        if (data.needs_clarification) {
          responseContent = `⚠️ ${data.clarification_question}\n\n`;
          if (data.ambiguous_matches) {
            data.ambiguous_matches.forEach(m => {
              responseContent += `• **${m.fullName}** — ${m.applied_role || 'N/A'} (${m.applicationStage || 'N/A'})\n  Use: "Move ${m.fullName} to Round 2"\n\n`;
            });
          }
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseContent,
          isAction: true,
          actionData: data,
        }]);

      } else {
        const res = await axios.post(`${AI_API}/api/chat`, {
          session_id: sessionId,
          message: userMsg,
        });
        const data = res.data;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response || 'No response received.',
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
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        className="chat-fab"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={open ? { rotate: 0 } : { rotate: 0 }}
      >
        {open ? <HiOutlineXMark size={24} /> : <HiOutlineChatBubbleLeftRight size={24} />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, x: 400, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <HiOutlineCpuChip size={20} />
                <span className="chat-header-title">TalentMind AI</span>
              </div>
              <div className="chat-header-actions">
                <button className="chat-header-btn" title="Clear history" onClick={handleClearHistory}>
                  <HiOutlineTrash size={16} />
                </button>
                <button className="chat-header-btn" onClick={() => setOpen(false)}>
                  <HiOutlineXMark size={18} />
                </button>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="chat-mode-toggle">
              <button
                className={`chat-mode-btn ${mode === 'chat' ? 'active' : ''}`}
                onClick={() => setMode('chat')}
              >
                <HiOutlineSparkles size={14} /> Chat
              </button>
              <button
                className={`chat-mode-btn chat-mode-action ${mode === 'action' ? 'active' : ''}`}
                onClick={() => setMode('action')}
              >
                <HiOutlineBolt size={14} /> Actions
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loadingHistory ? (
                <div className="chat-loading-history">Loading history...</div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <HiOutlineCpuChip size={32} />
                  <p>Hi! I'm TalentMind AI.</p>
                  <p className="chat-empty-hint">
                    {mode === 'action'
                      ? 'Type commands like "Move Rahul to Round 2"'
                      : 'Ask me "Find top React devs" or "Compare candidates"'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                    <div className="chat-msg-avatar">
                      {msg.role === 'user' ? <HiOutlineUser size={14} /> : <HiOutlineCpuChip size={14} />}
                    </div>
                    <div className={`chat-msg-bubble ${msg.isAction ? 'chat-msg-action' : ''} ${msg.isError ? 'chat-msg-error' : ''}`}>
                      <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="chat-msg chat-msg-assistant">
                  <div className="chat-msg-avatar"><HiOutlineCpuChip size={14} /></div>
                  <div className="chat-msg-bubble chat-msg-typing">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <input
                className="chat-input"
                placeholder={mode === 'action' ? 'Type a command...' : 'Ask AI...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
              <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
                <HiOutlinePaperAirplane size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
