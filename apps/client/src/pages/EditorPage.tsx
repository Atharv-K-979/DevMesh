import React, { useState, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Socket } from 'socket.io-client';
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
import {
  ClientInfo,
  ChatMessage,
  ChatHistoryPayload,
  JoinedPayload,
  DisconnectedPayload,
  LiveKitTokenResponse,
  SessionRecording,
  AiCompletionRequest,
  AiCompletionResponse,
  WhiteboardElement,
  SocketActions,
} from '@devmesh/shared-types';
import { initSocket } from '../socket';
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
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mutedUserSockets, setMutedUserSockets] = useState<string[]>([]);
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filePreview, setFilePreview] = useState<boolean>(false);
  const [fileContent, setFileContent] = useState<string>('');
  const editorInstanceRef = useRef<EditorRef | null>(null);
  const codeRef = useRef<string>('');
  const activeRecordingIdRef = useRef<string | null>(null);

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

  // Synchronize whiteboard elements across room participants
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);

  useEffect(() => {
    const wbArray = doc.getArray<WhiteboardElement>('whiteboardElements');
    const updateWb = () => {
      setWhiteboardElements(wbArray.toArray());
    };
    updateWb();
    wbArray.observe(updateWb);
    return () => {
      wbArray.unobserve(updateWb);
    };
  }, [doc]);

  const handleWhiteboardChange = (elements: WhiteboardElement[]) => {
    const wbArray = doc.getArray<WhiteboardElement>('whiteboardElements');
    doc.transact(() => {
      wbArray.delete(0, wbArray.length);
      wbArray.push(elements);
    });
  };

  const recordEvent = async (type: 'code' | 'chat' | 'presence', author: string, detail: string) => {
    if (!activeRecordingIdRef.current) return;
    try {
      const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiHost}/api/recordings/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId: activeRecordingIdRef.current,
          type,
          author,
          detail,
        }),
      });
    } catch (err) {
      // Ignore background recording event errors
    }
  };

  // Socket.IO Room Lifecycle & Realtime Events
  useEffect(() => {
    if (!username) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const socket = initSocket();
    socketRef.current = socket;

    socket.emit(SocketActions.JOIN, { roomId, username });

    socket.on(
      SocketActions.JOINED,
      ({ clients: updatedClients, username: joinedUser }: JoinedPayload) => {
        if (joinedUser !== username) {
          toast.success(`${joinedUser} joined the room.`, { id: `join-${joinedUser}` });
        }
        const uniqueClients = updatedClients.filter(
          (c, idx, self) => idx === self.findIndex((item) => item.username === c.username)
        );
        setClients(uniqueClients);
        recordEvent('presence', joinedUser, `${joinedUser} joined room`);
      },
    );

    socket.on(
      SocketActions.DISCONNECTED,
      ({ socketId, username: leftUser, clients: updatedClients }: DisconnectedPayload) => {
        if (leftUser) {
          toast.success(`${leftUser} left the room.`, { id: `leave-${leftUser}` });
          recordEvent('presence', leftUser, `${leftUser} left room`);
        }
        if (updatedClients && updatedClients.length >= 0) {
          const uniqueClients = updatedClients.filter(
            (c, idx, self) => idx === self.findIndex((item) => item.username === c.username)
          );
          setClients(uniqueClients);
        } else {
          setClients((prev) => prev.filter((c) => c.socketId !== socketId));
        }
      },
    );

    socket.on(SocketActions.CHAT_HISTORY, ({ messages }: ChatHistoryPayload) => {
      setChatMessages(messages);
    });

    socket.on(SocketActions.CHAT_BROADCAST, (msg: ChatMessage) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      recordEvent('chat', msg.senderName, msg.content);

      const isMentioned = new RegExp(`@${username}\\b`, 'i').test(msg.content);
      if (msg.senderName !== username && isMentioned) {
        toast(`@${username} You were mentioned by ${msg.senderName}: "${msg.content}"`, {
          icon: '💬',
          duration: 5000,
        });
      }
    });

    socket.on(SocketActions.RECORDING_NOTIFY, (payload: any) => {
      if (payload.action === 'start') {
        toast(`${payload.username} started session recording`, { icon: '🔴' });
      } else {
        toast(`${payload.username} stopped session recording`);
      }
    });

    socket.on(SocketActions.USER_MUTE, (payload: any) => {
      if (payload.mute) {
        setMutedUserSockets((prev) => [...new Set([...prev, payload.targetSocketId])]);
        if (payload.targetSocketId === socket.id) {
          toast.error(`You were muted by ${payload.byUsername}`);
        }
      } else {
        setMutedUserSockets((prev) => prev.filter((id) => id !== payload.targetSocketId));
        if (payload.targetSocketId === socket.id) {
          toast.success(`You were unmuted by ${payload.byUsername}`);
        }
      }
    });

    socket.on(SocketActions.USER_KICK, (payload: any) => {
      if (payload.targetSocketId === socket.id) {
        toast.error(`You were removed from the room by host ${payload.byUsername}`);
        setTimeout(() => navigate('/'), 1200);
      } else {
        toast(`${payload.targetUsername} was removed by host ${payload.byUsername}`);
        setClients((prev) => prev.filter((c) => c.socketId !== payload.targetSocketId));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, username, navigate]);

  if (!username) {
    return <Navigate to="/" />;
  }

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

  const handleCreateFolder = (folderPath: string) => {
    const placeholder = `${folderPath}/index.ts`;
    handleCreateFile(placeholder);
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

  const handleSendChatMessage = (content: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SocketActions.CHAT_SEND, {
        roomId,
        content,
        senderName: username,
      });
    }
  };

  const handleFetchLiveKitToken = async (): Promise<LiveKitTokenResponse> => {
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiHost}/api/livekit/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: roomId || 'default-room',
        participantName: username,
      }),
    });
    return (await res.json()) as LiveKitTokenResponse;
  };

  const handleMuteUser = (targetSocketId: string, targetUsername: string, mute: boolean) => {
    socketRef.current?.emit(SocketActions.USER_MUTE, {
      roomId,
      targetSocketId,
      targetUsername,
      mute,
      byUsername: username,
    });
  };

  const handleMuteAll = () => {
    clients.forEach((c) => {
      if (c.username !== username) {
        handleMuteUser(c.socketId, c.username, true);
      }
    });
    toast.success('Muted all participants');
  };

  const handleKickUser = (targetSocketId: string, targetUsername: string) => {
    socketRef.current?.emit(SocketActions.USER_KICK, {
      roomId,
      targetSocketId,
      targetUsername,
      byUsername: username,
    });
  };

  const handleRunAiAction = async (req: AiCompletionRequest): Promise<AiCompletionResponse> => {
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiHost}/api/ai/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...req,
        contextCode: codeRef.current,
      }),
    });
    return await res.json();
  };

  const handleInsertAiCode = (codeSnippet: string) => {
    const current = codeRef.current || '';
    const updated = current ? `${current}\n\n${codeSnippet}` : codeSnippet;
    updateEditorCode(updated);
    toast.success('Inserted AI snippet into editor');
  };

  const handleStartRecording = async (customTitle?: string): Promise<string> => {
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiHost}/api/recordings/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        title: customTitle || `Session ${new Date().toLocaleTimeString()}`,
      }),
    });
    const data = await res.json();
    activeRecordingIdRef.current = data.recordingId;
    setIsRecording(true);

    socketRef.current?.emit(SocketActions.RECORDING_NOTIFY, {
      roomId,
      username,
      action: 'start',
    });
    toast.success('Started session recording');
    return data.recordingId;
  };

  const handleStopRecording = async () => {
    if (!activeRecordingIdRef.current) return;
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiHost}/api/recordings/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingId: activeRecordingIdRef.current }),
    });
    const recording = await res.json();
    activeRecordingIdRef.current = null;
    setIsRecording(false);
    setRecordings((prev) => [recording, ...prev]);

    socketRef.current?.emit(SocketActions.RECORDING_NOTIFY, {
      roomId,
      username,
      action: 'stop',
    });
    toast.success('Stopped session recording');
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

  const presenceUsers = clients.map((c) => ({
    socketId: c.socketId,
    username: c.username,
    color: c.color || '#6366f1',
    activeFile,
  }));

  const roomUsernames = clients.map((c) => c.username);

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
          users={presenceUsers.length > 0 ? presenceUsers : [{ socketId: 'self', username, color: '#6366f1', activeFile }]}
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
          onlineUsersCount={clients.length || 1}
        />

        {/* Dynamic Sidebar Panel */}
        {activeTool && (
          <aside className="w-80 bg-gray-950 border-r border-gray-800 shrink-0 h-full overflow-hidden flex flex-col">
            {activeTool === 'files' && (
              <FileTree
                files={files}
                activeFile={activeFile}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onExportZip={handleExportZip}
                onImportZip={handleImportZip}
                onUploadClick={() => fileInputRef.current?.click()}
              />
            )}

            {activeTool === 'chat' && (
              <ChatPanel
                messages={chatMessages}
                currentUsername={username}
                onSendMessage={handleSendChatMessage}
                roomUsers={roomUsernames.length > 0 ? roomUsernames : [username]}
              />
            )}

            {activeTool === 'call' && (
              <CallPanel
                roomId={roomId}
                username={username}
                onFetchToken={handleFetchLiveKitToken}
              />
            )}

            {activeTool === 'users' && (
              <UsersPanel
                clients={clients.length > 0 ? clients : [{ socketId: 'self', username }]}
                currentUsername={username}
                creatorUsername={clients[0]?.username || username}
                mutedUserSockets={mutedUserSockets}
                onMuteUser={handleMuteUser}
                onMuteAll={handleMuteAll}
                onKickUser={handleKickUser}
              />
            )}

            {activeTool === 'ai' && (
              <AiAssistantPanel
                currentCodeContext={codeRef.current}
                onRunAiAction={handleRunAiAction}
                onInsertCode={handleInsertAiCode}
              />
            )}

            {activeTool === 'whiteboard' && (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
                  <span className="text-xs font-semibold text-gray-300">Whiteboard</span>
                  <button
                    onClick={() => window.open(`/whiteboard/${roomId}?username=${encodeURIComponent(username)}`, '_blank')}
                    className="text-[11px] px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                  >
                    Open Full Page ↗
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <WhiteboardPanel
                    elements={whiteboardElements}
                    onElementsChange={handleWhiteboardChange}
                  />
                </div>
              </div>
            )}

            {activeTool === 'recordings' && (
              <RecordingsPanel
                recordings={recordings}
                isRecording={isRecording}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onReplayCodeChange={updateEditorCode}
              />
            )}

            {activeTool === 'settings' && (
              <EditorSettingsPanel
                language={settings.language}
                onLanguageChange={(language) => updateSettings({ language })}
                fontFamily={settings.fontFamily}
                onFontFamilyChange={(fontFamily) => updateSettings({ fontFamily })}
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
              <div
                key={file}
                className={`group flex items-center gap-1.5 px-3 py-1 text-xs rounded-t-lg font-mono border-t border-x transition-colors cursor-pointer ${
                  activeFile === file
                    ? 'bg-gray-900 border-gray-700 text-indigo-300 font-semibold'
                    : 'bg-gray-950 border-transparent text-gray-400 hover:text-gray-200'
                }`}
                onClick={() => setActiveFile(file)}
              >
                <span>{file}</span>
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-gray-500 rounded p-0.5 text-[10px] transition-all"
                    title={`Close ${file}`}
                  >
                    ×
                  </button>
                )}
              </div>
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
              tabSize={settings.tabSize}
              lineWrapping={settings.lineWrapping}
              onCodeChange={(code) => {
                codeRef.current = code;
                if (activeRecordingIdRef.current) {
                  recordEvent('code', username, code);
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
