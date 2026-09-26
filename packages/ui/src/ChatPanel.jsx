import React, { useState, useRef, useEffect } from 'react';

const renderFormattedText = (text, currentUsername) => {
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';

  lines.forEach((line, lineIdx) => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <div key={`codeblock-${lineIdx}`} className="my-1.5 rounded-lg bg-gray-950 border border-gray-800 p-2 font-mono text-[11px] overflow-x-auto text-indigo-200">
            {codeBlockLang && <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">{codeBlockLang}</div>}
            <pre className="whitespace-pre-wrap">{codeBlockContent.join('\n')}</pre>
          </div>
        );
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    const parts = [];
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|@\w+|https?:\/\/[^\s]+)/g;
    let lastIdx = 0;
    let match;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.slice(lastIdx, match.index));
      }

      const token = match[0];
      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={`code-${lineIdx}-${match.index}`} className="px-1 py-0.5 bg-black/40 rounded text-[11px] font-mono text-amber-300">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`b-${lineIdx}-${match.index}`} className="font-bold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={`i-${lineIdx}-${match.index}`} className="italic">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('@')) {
        const isMe = token.slice(1) === currentUsername;
        parts.push(
          <span key={`mention-${lineIdx}-${match.index}`} className={`px-1 rounded font-semibold font-mono text-[11px] ${isMe ? 'bg-amber-400 text-gray-950 font-bold' : 'text-indigo-300 bg-indigo-950/60'}`}>
            {token}
          </span>
        );
      } else if (token.startsWith('http')) {
        parts.push(
          <a
            key={`link-${lineIdx}-${match.index}`}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline break-all"
          >
            {token}
          </a>
        );
      }

      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < line.length) {
      parts.push(line.slice(lastIdx));
    }

    elements.push(
      <p key={`p-${lineIdx}`} className="leading-relaxed min-h-[1.2em]">
        {parts.length > 0 ? parts : line}
      </p>
    );
  });

  return elements;
};

export const ChatPanel = ({
  messages = [],
  currentUsername,
  onSendMessage,
  roomUsers = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const availableMentions = roomUsers.filter(
    (u) => u.toLowerCase().includes(mentionFilter.toLowerCase()) && u !== currentUsername
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    const lastWord = val.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1));
      setSelectedMentionIdx(0);
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (user) => {
    const words = inputText.split(/\s+/);
    words.pop();
    const updated = [...words, `@${user} `].join(' ');
    setInputText(updated);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showMentions && availableMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev + 1) % availableMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev - 1 + availableMentions.length) % availableMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(availableMentions[selectedMentionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowMentions(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Team Chat</span>
        <span className="text-[10px] text-gray-500 font-mono">Realtime</span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-500 italic py-8">
            No messages yet. Say hello or use @username to mention a teammate!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderName === currentUsername;
            const isSystem = msg.senderName === 'System';

            if (isSystem) {
              return (
                <div key={msg.id || idx} className="text-center my-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-400">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-baseline gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-semibold text-gray-400">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs break-words shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
                  }`}
                >
                  {renderFormattedText(msg.content, currentUsername)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Auto-Suggest Popup */}
      {showMentions && availableMentions.length > 0 && (
        <div className="mx-3 mb-1 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden p-1 space-y-0.5">
          <div className="text-[9px] uppercase tracking-wider font-bold text-gray-500 px-2 py-1">
            Mention Member
          </div>
          {availableMentions.map((user, idx) => (
            <div
              key={user}
              onClick={() => handleSelectMention(user)}
              className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-2 ${
                idx === selectedMentionIdx
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-indigo-500 text-[9px] flex items-center justify-center font-bold text-white">
                {user[0].toUpperCase()}
              </div>
              <span>@{user}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 border-t border-gray-800 bg-gray-900/60 flex items-center gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type message... (@ to mention, ```code```)"
          className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-sans max-h-24"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-sm transition-colors text-xs font-semibold"
          title="Send"
        >
          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};
