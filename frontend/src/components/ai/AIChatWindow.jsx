import React, { useState, useEffect, useRef } from 'react';
import { aiHubApi } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Send, Bot, User, Sparkles, Mic, MicOff, Volume2, Copy, Check,
  Paperclip, Sliders, Pin, Trash2, RotateCcw, StopCircle, Download, FileText, Search
} from 'lucide-react';

export default function AIChatWindow({ category = 'patient_health', defaultProvider = 'gemini', isDoctor = false, externalPrompt = '' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(defaultProvider);
  const [sessionId, setSessionId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [fileAttachment, setFileAttachment] = useState(null);
  const messagesEndRef = useRef(null);

  // Trigger prompt when external prompt changes
  useEffect(() => {
    if (externalPrompt) {
      handleSend(externalPrompt);
    }
  }, [externalPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice Input Speech recognition setup
  const handleMicToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return toast.error('Web Speech API is not supported in this browser');
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);
      toast('🎙️ Listening... speak now', { icon: '🎙️' });
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        toast.success(`Recognized: "${transcript}"`);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  };

  // Text-To-Speech output
  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) return toast.error('Speech synthesis not supported');
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    toast('🔊 Playing audio speech...', { icon: '🔊' });
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Message copied to clipboard');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() && !fileAttachment) return;

    const userMsg = {
      role: 'user',
      content: q,
      timestamp: new Date(),
      fileAttachment: fileAttachment ? { name: fileAttachment.name } : null
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentAttachment = fileAttachment;
    setFileAttachment(null);
    setLoading(true);

    try {
      let res;
      if (currentAttachment) {
        res = await aiHubApi.analyzeFile({
          fileName: currentAttachment.name,
          documentCategory: currentAttachment.type || 'Medical Report',
        });
        const botMsg = {
          role: 'assistant',
          content: res.data.data.analysis,
          disclaimer: '⚠️ MEDICAL DISCLAIMER: For educational purposes only.',
          aiPowered: true,
          provider: res.data.data.providerUsed || provider,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        res = await aiHubApi.chat({
          prompt: q,
          sessionId,
          provider,
          category,
        });

        if (res.data?.data?.sessionId) {
          setSessionId(res.data.data.sessionId);
        }

        const msgData = res.data.data.message;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: msgData.content,
          disclaimer: msgData.disclaimer,
          aiPowered: msgData.aiPowered,
          provider: msgData.provider,
          timestamp: new Date(msgData.timestamp),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered a communication issue. Please try again or switch provider.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (content) => {
    if (!content) return null;
    const blocks = content.split('\n\n');
    return blocks.map((block, bIdx) => {
      const lines = block.split('\n').filter(Boolean);
      const isList = lines.some(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));

      if (isList) {
        return (
          <ul key={bIdx} style={{ margin: '8px 0', paddingLeft: 20, listStyleType: 'disc' }}>
            {lines.map((line, lIdx) => {
              const clean = line.trim().replace(/^[-*]\s+/, '');
              return <li key={lIdx} style={{ marginBottom: 4 }}>{clean}</li>;
            })}
          </ul>
        );
      }

      return (
        <div key={bIdx} style={{ margin: '6px 0', lineHeight: 1.6 }}>
          {lines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg, #1a1c23)', overflow: 'hidden' }}>
      {/* Top Provider Bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={18} color="var(--accent-purple)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI Provider:</span>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="input-field"
            style={{ fontSize: 12, padding: '4px 10px', height: 'auto', background: 'var(--bg-primary)' }}
          >
            <option value="gemini">Google Gemini 2.0 (Recommended)</option>
            <option value="gpt">OpenAI GPT-4o</option>
            <option value="claude">Anthropic Claude 3.5</option>
            <option value="deepseek">DeepSeek V3</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-purple" style={{ fontSize: 10 }}>
            {isDoctor ? 'Clinical AI Mode' : 'Patient Health Mode'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', gap: 20, textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
              <Bot size={32} color="white" />
            </div>
            <div style={{ maxWidth: 460 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isDoctor ? 'Doctor AI Clinical Assistant' : 'How can I assist your health today?'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>
                {isDoctor
                  ? 'Generate SOAP notes, review medical reports, draft treatment plans, check drug interactions, and analyze patient risk trends.'
                  : 'Ask anything about your medications, blood reports, X-rays, diet & exercise plans, or check for drug interactions.'}
              </p>
            </div>

            {/* Quick Action Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 540, marginTop: 8 }}>
              {(isDoctor ? [
                { icon: '📝', label: 'SOAP Notes Draft', prompt: 'Generate a structured SOAP note for a cardiology patient with hypertension.' },
                { icon: '🩺', label: 'Patient Risk Analysis', prompt: 'Analyze high-risk patients with missed medication adherence in the past 14 days.' },
                { icon: '💊', label: 'Drug Interaction Audit', prompt: 'Perform a comprehensive drug interaction and allergy audit for active prescriptions.' },
                { icon: '📊', label: 'Visit Summary Draft', prompt: 'Draft a patient-friendly visit summary including lifestyle instructions and follow-up timeline.' },
              ] : [
                { icon: '🩸', label: 'Blood Report Analysis', prompt: 'Explain my complete blood count (CBC) and blood sugar report results in simple terms.' },
                { icon: '🥗', label: 'Diet & Exercise Tips', prompt: 'Give me personalized diet and exercise suggestions that are safe with my active medications.' },
                { icon: '⚠️', label: 'Drug Interaction Check', prompt: 'Check for drug interactions between my active medications and dietary supplements.' },
                { icon: '🧠', label: 'MRI / CT Report Summary', prompt: 'Summarize my MRI and CT Scan findings and explain key medical terms.' },
              ]).map((card, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => handleSend(card.prompt)}
                  style={{
                    padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4
                  }}
                  className="interactive-card"
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{card.icon}</span> <span>{card.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--gradient-primary)' : 'rgba(139,92,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--accent-purple)" />}
                </div>

                <div style={{
                  maxWidth: '80%', padding: '14px 16px', borderRadius: 14,
                  background: msg.role === 'user' ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.03)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    {msg.role === 'user' ? msg.content : parseMarkdown(msg.content)}
                  </div>

                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {copiedIdx === idx ? <Check size={12} color="#10b981" /> : <Copy size={12} />} Copy
                      </button>

                      <button
                        onClick={() => handleSpeak(msg.content)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Volume2 size={12} /> Speak
                      </button>

                      {msg.provider && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', textTransform: 'uppercase' }}>
                          via {msg.provider}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="var(--accent-purple)" />
                </div>
                <div className="spinner" style={{ width: 18, height: 18 }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div style={{ padding: 14, borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
        {fileAttachment && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(139,92,246,0.1)', borderRadius: 8, marginBottom: 8, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color="var(--accent-purple)" /> Attached: {fileAttachment.name}
            </span>
            <button onClick={() => setFileAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <StopCircle size={14} color="#f43f5e" />
            </button>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
            <Paperclip size={18} color="var(--text-muted)" />
            <input
              type="file"
              onChange={e => e.target.files?.[0] && setFileAttachment(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="button"
            onClick={handleMicToggle}
            style={{
              padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: isListening ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.05)',
              color: isListening ? '#f43f5e' : 'var(--text-muted)'
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            className="input-field"
            placeholder={isDoctor ? 'Draft SOAP notes, search patient history, ask clinical questions...' : 'Ask about your medications, blood reports, symptoms...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            style={{ flex: 1 }}
          />

          <button className="btn-primary" type="submit" disabled={loading || (!input.trim() && !fileAttachment)} style={{ padding: '10px 18px' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
