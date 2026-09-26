import React from 'react';

interface StatusBarProps {
  activeFile: string;
  cursorLine?: number;
  cursorColumn?: number;
  language?: string;
  tabSize?: number;
  roomId?: string;
  onlineCount?: number;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onOpenCommandPalette?: () => void;
  onSelectLanguage?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeFile,
  cursorLine = 1,
  cursorColumn = 1,
  language = 'TypeScript',
  tabSize = 2,
  roomId,
  onlineCount = 1,
  syncStatus = 'synced',
  onOpenCommandPalette,
  onSelectLanguage,
}) => {
  return (
    <div className="h-6 bg-gray-950 border-t border-gray-800 px-3 flex items-center justify-between text-[11px] font-mono text-gray-400 select-none shrink-0 z-20">
      {/* Left items */}
      <div className="flex items-center gap-3 truncate">
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors"
            title="Open Command Palette (Ctrl+K or Cmd+K)"
          >
            <span className="font-semibold text-indigo-400 font-sans">⌘K</span>
            <span className="hidden sm:inline text-gray-500">Command</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="truncate max-w-[150px] sm:max-w-xs">{activeFile}</span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-gray-500">
          <span>Ln {cursorLine}, Col {cursorColumn}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-gray-500">
          <span>Spaces: {tabSize}</span>
        </div>

        <div className="hidden xl:flex items-center gap-1 text-gray-500">
          <span>UTF-8</span>
          <span>•</span>
          <span>LF</span>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3 shrink-0">
        {onSelectLanguage ? (
          <button
            onClick={onSelectLanguage}
            className="hover:text-gray-200 capitalize text-gray-400 transition-colors"
            title="Change Syntax Language"
          >
            {language}
          </button>
        ) : (
          <span className="capitalize text-gray-400">{language}</span>
        )}

        {roomId && (
          <span className="hidden sm:inline text-gray-500 truncate max-w-[120px]">
            Room: <span className="text-gray-300 font-semibold">{roomId}</span>
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50"></span>
          <span className="text-gray-300">{onlineCount} Online</span>
        </div>

        <div className="flex items-center gap-1">
          {syncStatus === 'synced' && (
            <span className="text-emerald-400 font-medium">✓ Synced</span>
          )}
          {syncStatus === 'syncing' && (
            <span className="text-amber-400 font-medium animate-pulse">↻ Syncing...</span>
          )}
          {syncStatus === 'offline' && (
            <span className="text-red-400 font-medium">✕ Disconnected</span>
          )}
        </div>
      </div>
    </div>
  );
};
