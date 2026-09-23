import React from 'react';

interface EditorSettingsPanelProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  tabSize: number;
  onTabSizeChange: (size: number) => void;
  lineWrapping: boolean;
  onLineWrappingChange: (wrapping: boolean) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  fontFamily?: string;
  onFontFamilyChange?: (fontFamily: string) => void;
}

export const EditorSettingsPanel: React.FC<EditorSettingsPanelProps> = ({
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
  tabSize,
  onTabSizeChange,
  lineWrapping,
  onLineWrappingChange,
  language = 'javascript',
  onLanguageChange,
  fontFamily = 'monospace',
  onFontFamilyChange,
}) => {
  const themes = [
    { id: 'dracula', name: 'Dracula (Dark)' },
    { id: 'tokyoNight', name: 'Tokyo Night' },
    { id: 'oneDark', name: 'One Dark' },
    { id: 'githubLight', name: 'GitHub Light' },
    { id: 'solarizedDark', name: 'Solarized Dark' },
    { id: 'nord', name: 'Nord' },
  ];

  const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'python', name: 'Python' },
    { id: 'cpp', name: 'C / C++' },
    { id: 'java', name: 'Java' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'json', name: 'JSON' },
    { id: 'markdown', name: 'Markdown' },
    { id: 'sql', name: 'SQL' },
    { id: 'rust', name: 'Rust' },
    { id: 'go', name: 'Go' },
  ];

  const fontFamilies = [
    { id: "'Fira Code', monospace", name: 'Fira Code' },
    { id: "'JetBrains Mono', monospace", name: 'JetBrains Mono' },
    { id: "'Source Code Pro', monospace", name: 'Source Code Pro' },
    { id: "'Inconsolata', monospace", name: 'Inconsolata' },
    { id: 'monospace', name: 'System Monospace' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-xs font-bold tracking-wider text-gray-400">Editor Settings</h3>
      </div>

      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        {/* Programming Language */}
        {onLanguageChange && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Syntax Language</label>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Editor Theme */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-300">Color Theme</label>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Family */}
        {onFontFamilyChange && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => onFontFamilyChange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {fontFamilies.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Font Size */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-gray-300">Font Size</label>
            <span className="font-mono text-gray-400">{fontSize}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="24"
            step="1"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-gray-800"
          />
        </div>

        {/* Tab Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-300">Tab Size</label>
          <div className="flex gap-2">
            {[2, 4, 8].map((size) => (
              <button
                key={size}
                onClick={() => onTabSizeChange(size)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                  tabSize === size
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-bold'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {size} spaces
              </button>
            ))}
          </div>
        </div>

        {/* Line Wrapping */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div>
            <div className="text-xs font-semibold text-gray-300">Line Wrapping</div>
            <div className="text-[10px] text-gray-500">Wrap long code lines automatically</div>
          </div>
          <input
            type="checkbox"
            checked={lineWrapping}
            onChange={(e) => onLineWrappingChange(e.target.checked)}
            className="rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
