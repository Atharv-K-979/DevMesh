import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@devmesh/shared-types';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUsername: string;
  onSendMessage: (content: string) => void;
  roomUsers: string[];
}

const renderFormattedText = (text: string, currentUsername: string) => {
  // Support code blocks, inline code, bold, italics, links, and @mentions
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
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

    // Parse inline tokens: `code`, **bold**, *italic*, @username
    const parts: React.ReactNode[] = [];
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|@\w+|https?:\/\/[^\s]+)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

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
          <a key={`link-${lineIdx}-${match.index}`} href={token} target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300 break-all">
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
      <p key={`line-${lineIdx}`} className={lineIdx > 0 ? 'mt-1' : ''}>
        {parts.length > 0 ? parts : line}
      </p>
    );
  });

  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre key="unclosed-code" className="my-1 rounded bg-gray-950 p-2 font-mono text-[11px] overflow-x-auto text-indigo-200">
        {codeBlockContent.join('\n')}
      </pre>
    );
  }

  return elements;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUsername,
  onSendMessage,
  roomUsers,
}) => {
  const [input, setInput] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (isAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScroll(isAtBottom);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const match = value.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (username: string) => {
    setInput((prev) => prev.replace(/@(\w*)$/, `@${username} `));
    setMentionQuery(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setMentionQuery(null);
  };

  const filteredMentions = mentionQuery !== null
    ? roomUsers.filter((u) => u.toLowerCase().startsWith(mentionQuery))
    : [];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Room Chat</span>
        <span className="text-xs text-gray-500">{messages.length} messages</span>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-xs text-gray-500 italic text-center py-6">
            No messages yet. Send a message to start chatting!
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.senderId === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <span className="px-2.5 py-0.5 bg-gray-800/80 text-gray-400 border border-gray-700/50 rounded-full font-mono text-[10px]">
                    {msg.content} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            }

            const isMe = msg.senderName === currentUsername;
            const hasMention = msg.content.includes(`@${currentUsername}`);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                  <span className="font-semibold text-gray-300">{msg.senderName}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] break-words shadow-sm ${
                    hasMention
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : isMe
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-gray-800 text-gray-200 border border-gray-700'
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

      {mentionQuery !== null && filteredMentions.length > 0 && (
        <div className="p-1 bg-gray-800 border-t border-gray-700 max-h-24 overflow-y-auto">
          {filteredMentions.map((user) => (
            <div
              key={user}
              onClick={() => insertMention(user)}
              className="px-3 py-1 text-xs hover:bg-gray-700 rounded cursor-pointer text-indigo-400 font-mono"
            >
              @{user}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Type message... (@username)"
          value={input}
          onChange={handleInputChange}
          className="flex-1 min-w-[120px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};
