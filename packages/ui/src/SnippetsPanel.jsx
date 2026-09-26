import React, { useState } from 'react';

const DEFAULT_SNIPPETS = [
  {
    id: 'snip-1',
    title: 'Express REST Endpoint',
    description: 'Basic Express router endpoint with error handling',
    language: 'javascript',
    tags: ['backend', 'express', 'node'],
    createdAt: Date.now(),
    code: `export const handleGetResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id, timestamp: Date.now() } });
  } catch (error) {
    next(error);
  }
};`,
  },
  {
    id: 'snip-2',
    title: 'React useDebounce Hook',
    description: 'Debounce value updates with configurable delay',
    language: 'javascript',
    tags: ['react', 'hooks', 'frontend'],
    createdAt: Date.now(),
    code: `import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}`,
  },
  {
    id: 'snip-3',
    title: 'Binary Search Implementation',
    description: 'Binary search algorithm for sorted arrays',
    language: 'javascript',
    tags: ['algorithm', 'data-structures'],
    createdAt: Date.now(),
    code: `export function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }

  return -1;
}`,
  },
  {
    id: 'snip-4',
    title: 'FastAPI Hello Route',
    description: 'Simple asynchronous FastAPI route handler with Pydantic',
    language: 'python',
    tags: ['python', 'fastapi', 'backend'],
    createdAt: Date.now(),
    code: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items/")
async def create_item(item: Item):
    return {"message": "Created", "item": item}`,
  },
];

export const SnippetsPanel = ({ onInsertCode }) => {
  const [snippets, setSnippets] = useState(DEFAULT_SNIPPETS);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLang, setNewLang] = useState('javascript');

  const allTags = Array.from(new Set(snippets.flatMap((s) => s.tags)));

  const filteredSnippets = snippets.filter((s) => {
    const matchesQuery =
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchesTag = selectedTag ? s.tags.includes(selectedTag) : true;
    return matchesQuery && matchesTag;
  });

  const handleAddSnippet = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    const snippet = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom snippet',
      language: newLang,
      code: newCode.trim(),
      tags: ['custom'],
      createdAt: Date.now(),
    };

    setSnippets([snippet, ...snippets]);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
    setNewCode('');
  };

  const handleDeleteSnippet = (id) => {
    setSnippets(snippets.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Code Snippets</span>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          {isCreating ? 'Cancel' : '+ New Snippet'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleAddSnippet} className="p-3 bg-gray-900 border-b border-gray-800 space-y-2">
          <input
            type="text"
            placeholder="Snippet Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Short description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <textarea
            rows={4}
            placeholder="Paste code snippet here..."
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            required
          />
          <button
            type="submit"
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Save Snippet
          </button>
        </form>
      )}

      {/* Search & Tag filter */}
      <div className="p-2 border-b border-gray-800 space-y-2">
        <input
          type="text"
          placeholder="Search snippets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />

        {allTags.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                selectedTag === null ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors whitespace-nowrap ${
                  selectedTag === tag ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Snippet List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredSnippets.length === 0 ? (
          <div className="text-center text-xs text-gray-500 italic py-8">
            No matching snippets found.
          </div>
        ) : (
          filteredSnippets.map((s) => (
            <div
              key={s.id}
              className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">{s.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  {onInsertCode && (
                    <button
                      onClick={() => onInsertCode(s.code)}
                      className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold transition-colors"
                      title="Insert into editor"
                    >
                      Insert
                    </button>
                  )}
                  {s.tags.includes('custom') && (
                    <button
                      onClick={() => handleDeleteSnippet(s.id)}
                      className="p-1 text-gray-500 hover:text-red-400 text-xs transition-colors"
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <pre className="p-2 bg-gray-950 rounded-lg text-[11px] font-mono text-gray-300 overflow-x-auto max-h-32 border border-gray-850">
                {s.code}
              </pre>

              <div className="flex flex-wrap gap-1">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-950 text-gray-500 border border-gray-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
