import React, { useState, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
import { Editor, EditorRef } from '../components/Editor';
import { FilePreview } from '../components/FilePreview';
import { useSettingsStore } from '../store/settingsStore';

export const EditorPage: React.FC = () => {
  const { roomId = 'default-room' } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const username = (location.state as any)?.username || 'Guest';

  const [activeTool, setActiveTool] = useState<ActiveTool>('files');
  const [activeFile, setActiveFile] = useState<string>('index.ts');
  const [files, setFiles] = useState<string[]>(['index.ts', 'styles.css', 'README.md']);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filePreview, setFilePreview] = useState<boolean>(false);
  const [fileContent, setFileContent] = useState<string>('');
  const editorInstanceRef = useRef<EditorRef | null>(null);
  const codeRef = useRef<string>('');

  const { settings, updateSettings, appTheme, toggleAppTheme } = useSettingsStore();

  // Yjs collaborative workspace & persistence initialization
  const { doc, provider } = useMemo(() => {
    const ydoc = new Y.Doc();
    const wsUrl = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:1234';
    const hocusProvider = new HocuspocusProvider({
      url: wsUrl,
      name: roomId || 'default-room',
      document: ydoc,
    });
    new IndexeddbPersistence(roomId || 'default-room', ydoc);
    return { doc: ydoc, provider: hocusProvider };
  }, [roomId]);

  // Synchronize multi-file tree across room participants
  useEffect(() => {
    const filesArray = doc.getArray<string>('projectFiles');
    let initTimer: ReturnType<typeof setTimeout> | null = null;

    const updateFilesList = () => {
      const raw = filesArray.toArray();
      const unique = [...new Set(raw)];

      if (unique.length !== raw.length) {
        doc.transact(() => {
          filesArray.delete(0, filesArray.length);
          filesArray.push(unique);
        });
        return;
      }

      if (unique.length === 0) {
        if (initTimer) clearTimeout(initTimer);
        initTimer = setTimeout(() => {
          if (filesArray.length === 0) {
            doc.transact(() => {
              filesArray.push(['index.ts', 'styles.css', 'README.md']);
            });
          }
        }, 300);
      } else {
        setFiles(unique);
        if (!unique.includes(activeFile)) {
          setActiveFile(unique[0]);
        }
        if (initTimer) clearTimeout(initTimer);
      }
    };

    updateFilesList();
    filesArray.observe(updateFilesList);

    return () => {
      filesArray.unobserve(updateFilesList);
      if (initTimer) clearTimeout(initTimer);
      provider.destroy();
    };
  }, [doc, provider, activeFile]);

  const handleSelectFile = (path: string) => {
    setActiveFile(path);
  };

  const handleCreateFile = (filePath: string) => {
    const filesArray = doc.getArray<string>('projectFiles');
    if (!filesArray.toArray().includes(filePath)) {
      doc.transact(() => {
        filesArray.push([filePath]);
      });
      setActiveFile(filePath);
      toast.success(`Created file ${filePath}`);
    }
  };

  const handleDeleteFile = (filePath: string) => {
    const filesArray = doc.getArray<string>('projectFiles');
    const current = filesArray.toArray();
    const index = current.indexOf(filePath);
    if (index !== -1 && current.length > 1) {
      doc.transact(() => {
        filesArray.delete(index, 1);
        const yText = doc.getText(`file:${filePath}`);
        yText.delete(0, yText.length);
      });
      const remaining = current.filter((f) => f !== filePath);
      if (activeFile === filePath && remaining.length > 0) {
        setActiveFile(remaining[0]);
      }
      toast.success(`Deleted file ${filePath}`);
    }
  };

  const handleRenameFile = (oldPath: string, newPath: string) => {
    const filesArray = doc.getArray<string>('projectFiles');
    const current = filesArray.toArray();
    const index = current.indexOf(oldPath);
    if (index !== -1 && newPath && !current.includes(newPath)) {
      const oldYText = doc.getText(`file:${oldPath}`);
      const content = oldYText.toString();
      doc.transact(() => {
        filesArray.delete(index, 1);
        filesArray.push([newPath]);
        const newYText = doc.getText(`file:${newPath}`);
        newYText.insert(0, content);
        oldYText.delete(0, oldYText.length);
      });
      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }
      toast.success(`Renamed to ${newPath}`);
    }
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    files.forEach((filePath) => {
      const yText = doc.getText(`file:${filePath}`);
      zip.file(filePath, yText.toString());
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `devmesh-${roomId || 'workspace'}.zip`);
    toast.success('Exported project zip');
  };

  const handleImportZip = async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const filesArray = doc.getArray<string>('projectFiles');
      const newPaths: string[] = [];
      const entries = Object.entries(zip.files);

      for (const [relativePath, zipEntry] of entries) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('string');
          newPaths.push(relativePath);
          const yText = doc.getText(`file:${relativePath}`);
          doc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, content);
          });
        }
      }

      doc.transact(() => {
        filesArray.delete(0, filesArray.length);
        filesArray.push(newPaths);
      });

      if (newPaths.length > 0) {
        setActiveFile(newPaths[0]);
      }
      toast.success(`Imported ${newPaths.length} files from zip`);
    } catch (err) {
      toast.error('Failed to import zip');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
        setFilePreview(true);
      };
      reader.readAsText(file);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateEditorCode = (newCode: string) => {
    editorInstanceRef.current?.setCode(newCode);
    codeRef.current = newCode;
  };

  const handleAppendCode = () => {
    const currentCode = codeRef.current || '';
    const appendedCode = currentCode ? `${currentCode}\n\n${fileContent}` : fileContent;
    updateEditorCode(appendedCode);
    setFilePreview(false);
    resetFileInput();
  };

  const handleReplaceCode = () => {
    updateEditorCode(fileContent);
    setFilePreview(false);
    resetFileInput();
  };

  const copyRoomId = async () => {
    try {
      if (roomId) {
        await navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied to clipboard');
      }
    } catch (err) {
      toast.error('Could not copy Room ID');
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
          <button
            onClick={copyRoomId}
            className="text-xs px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-mono transition-colors"
          >
            Copy
          </button>
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
                onRenameFile={handleRenameFile}
                onExportZip={handleExportZip}
                onImportZip={handleImportZip}
                onUploadClick={() => fileInputRef.current?.click()}
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
          {/* File Upload Hidden Input */}
          <input
            type="file"
            accept=".js,.ts,.py,.java,.cpp,.c,.txt,.html,.css,.json,.md"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          {/* File Diff Modal */}
          {filePreview && (
            <FilePreview
              setFilePreview={setFilePreview}
              fileContent={fileContent}
              currentCode={codeRef.current}
              resetFileInput={resetFileInput}
              onAppend={handleAppendCode}
              onReplace={handleReplaceCode}
            />
          )}

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

          {/* CodeMirror Collaborative Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              ref={editorInstanceRef}
              doc={doc}
              provider={provider}
              activeFilePath={activeFile}
              username={username}
              language={settings.language}
              theme={settings.theme}
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              onCodeChange={(code) => {
                codeRef.current = code;
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
