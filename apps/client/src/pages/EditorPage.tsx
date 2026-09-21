import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FileTree,
  PresenceBar,
  ToolsPanel,
  ActiveTool,
  EditorSettingsPanel,
  ChatPanel,
  CallPanel,
  UsersPanel,
  AiAssistantPanel,
  WhiteboardPanel,
  RecordingsPanel,
} from '@devmesh/ui';
import { useSettingsStore } from '../store/settingsStore';

export const EditorPage: React.FC = () => {
  const { roomId = 'default-room' } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const username = (location.state as any)?.username || 'Guest';

  const [activeTool, setActiveTool] = useState<ActiveTool>('files');
  const [files, setFiles] = useState<string[]>(['index.ts', 'styles.css', 'README.md']);
  const [activeFile, setActiveFile] = useState<string>('index.ts');

  const { settings, updateSettings, appTheme, toggleAppTheme } = useSettingsStore();

  const handleSelectFile = (path: string) => {
    setActiveFile(path);
  };

  const handleCreateFile = (path: string) => {
    if (!files.includes(path)) {
      setFiles((prev) => [...prev, path]);
      setActiveFile(path);
    }
  };

  const handleDeleteFile = (path: string) => {
    const updated = files.filter((f) => f !== path);
    setFiles(updated);
    if (activeFile === path && updated.length > 0) {
      setActiveFile(updated[0]);
    }
  };

  return (
    <div
      data-app-theme={appTheme}
      className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-gray-100"
    >
      {/* Top Presence & Room Header */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900/90 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm tracking-tight"
          >
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">
              DM
            </span>
            <span>DevMesh</span>
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-300">
            Room: {roomId}
          </span>
        </div>

        <PresenceBar
          users={[
            { socketId: 'self', username, color: '#6366f1', activeFile },
          ]}
          currentUsername={username}
          theme={appTheme === 'dark' ? 'dracula' : 'githubLight'}
          onToggleTheme={toggleAppTheme}
        />
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Icon Navigation Rail */}
        <ToolsPanel
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          unreadCount={0}
          onlineUsersCount={1}
        />

        {/* Dynamic Sidebar Panel */}
        {activeTool && (
          <aside className="w-72 bg-gray-950 border-r border-gray-800 shrink-0 h-full overflow-hidden">
            {activeTool === 'files' && (
              <FileTree
                files={files}
                activeFile={activeFile}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onExportZip={() => {}}
                onImportZip={() => {}}
              />
            )}

            {activeTool === 'chat' && (
              <ChatPanel
                messages={[]}
                currentUsername={username}
                onSendMessage={() => {}}
                roomUsers={[username]}
              />
            )}

            {activeTool === 'call' && (
              <CallPanel
                roomId={roomId}
                username={username}
                onFetchToken={async () => ({
                  token: '',
                  wsUrl: 'ws://localhost:7880',
                  isConfigured: false,
                })}
              />
            )}

            {activeTool === 'users' && (
              <UsersPanel
                clients={[{ socketId: 'self', username }]}
                currentUsername={username}
              />
            )}

            {activeTool === 'ai' && (
              <AiAssistantPanel
                onRunAiAction={async () => ({
                  result: 'AI assistant ready.',
                  action: 'explain',
                  timestamp: Date.now(),
                })}
              />
            )}

            {activeTool === 'whiteboard' && (
              <WhiteboardPanel />
            )}

            {activeTool === 'recordings' && (
              <RecordingsPanel
                recordings={[]}
                isRecording={false}
                onStartRecording={() => {}}
                onStopRecording={() => {}}
              />
            )}

            {activeTool === 'settings' && (
              <EditorSettingsPanel
                fontSize={settings.fontSize}
                onFontSizeChange={(fontSize) => updateSettings({ fontSize })}
                theme={settings.theme}
                onThemeChange={(theme) => updateSettings({ theme })}
                tabSize={settings.tabSize}
                onTabSizeChange={(tabSize) => updateSettings({ tabSize })}
                lineWrapping={settings.lineWrapping}
                onLineWrappingChange={(lineWrapping) => updateSettings({ lineWrapping })}
              />
            )}
          </aside>
        )}

        {/* Code Editor Main Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-900 overflow-hidden">
          {/* Editor File Tab Bar */}
          <div className="flex items-center bg-gray-950 border-b border-gray-800 px-2 py-1 gap-1 overflow-x-auto">
            {files.map((file) => (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`px-3 py-1 text-xs rounded-t-lg font-mono border-t border-x transition-colors ${
                  activeFile === file
                    ? 'bg-gray-900 border-gray-700 text-indigo-300 font-semibold'
                    : 'bg-gray-950 border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {file}
              </button>
            ))}
          </div>

          {/* Editor Work Area */}
          <div className="flex-1 p-4 font-mono text-sm overflow-auto text-gray-300">
            <div className="text-gray-500">// Editing {activeFile}</div>
            <div className="mt-2 text-indigo-400">
              // DevMesh collaborative editor workspace initialized.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
