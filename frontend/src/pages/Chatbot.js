import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';

// Render Gemini Markdown without injecting model-generated HTML into the page.
// This covers the concise headings, lists, emphasis and code Gemini returns.
const renderInlineMarkdown = (text) => text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
  if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
  if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
  if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
  return part;
});

const MarkdownMessage = ({ text }) => (
  <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
    {text.split('\n').map((line, index) => {
      const heading = line.match(/^#{1,3}\s+(.+)/);
      const bullet = line.match(/^[-*]\s+(.+)/);
      const numbered = line.match(/^\d+\.\s+(.+)/);
      if (heading) return <div key={index} className="fw-bold mt-1">{renderInlineMarkdown(heading[1])}</div>;
      if (bullet) return <div key={index} className="ms-2">• {renderInlineMarkdown(bullet[1])}</div>;
      if (numbered) return <div key={index} className="ms-2">{line.match(/^\d+\./)[0]} {renderInlineMarkdown(numbered[1])}</div>;
      return <React.Fragment key={index}>{renderInlineMarkdown(line)}{index < text.split('\n').length - 1 && '\n'}</React.Fragment>;
    })}
  </div>
);

const Chatbot = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/chatbot/history');
      setMessages(data.history);
    } catch (err) {
      toast.error(t('chatHistoryFailed'));
    }
  };

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input, _id: Date.now() };
    // State changes happen before the network request so the typing indicator
    // is painted immediately, even on a slow connection.
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setInput('');
    try {
      const { data } = await api.post('/chatbot/message', { message: userMsg.text });
      setMessages((prev) => [...prev, data.reply]);
    } catch (err) {
      toast.error(t('messageFailed'));
      setMessages((prev) => [...prev, {
        _id: `error-${Date.now()}`,
        sender: 'bot',
        isError: true,
        text: err.response?.data?.message || 'Unable to reach Agro Vision AI right now. Please try again.',
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-card p-4 d-flex flex-column" style={{ height: '75vh' }}>
      <h5 className="section-title mb-3"><i className="bi bi-chat-dots me-2"></i>{t('aiAgricultureAssistant')}</h5>
      <div className="flex-grow-1 overflow-auto mb-3 px-2">
        {messages.length === 0 && (
          <p className="text-muted small text-center mt-4">
            {t('chatEmpty')}
          </p>
        )}
        {messages.map((m) => (
          <div key={m._id} className={`d-flex mb-2 ${m.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div
              className="p-2 px-3 rounded-4"
              style={{
                maxWidth: '75%',
                background: m.sender === 'user' ? 'var(--agri-green-500)' : 'var(--chat-bot-bg)',
                color: m.sender === 'user' ? 'var(--on-primary)' : 'var(--app-text)',
              }}
            >
              {m.sender === 'bot' ? <MarkdownMessage text={m.text} /> : m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="d-flex mb-2 justify-content-start" aria-live="polite">
            <div className="p-2 px-3 rounded-4" style={{ background: 'var(--chat-bot-bg)', color: 'var(--app-text)' }}>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Agro Vision AI is typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="input-group" onSubmit={handleSend}>
        <input className="form-control" placeholder={t('typeQuestion')} value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn btn-agri" type="submit" disabled={sending}>{t('send')}</button>
      </form>
    </div>
  );
};

export default Chatbot;
