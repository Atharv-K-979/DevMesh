import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  FileTree,
  PresenceBar,
  ToolsPanel,
  EditorSettingsPanel,
  ChatPanel,
  CallPanel,
  UsersPanel,
  AiAssistantPanel,
  WhiteboardPanel,
  RecordingsPanel,
  StatusBar,
  CommandPalette,
  CodeRunnerPanel,
  SnippetsPanel,
} from '@devmesh/ui';
import { SocketActions } from '@devmesh/shared-types';
import { initSocket } from '../socket';
import { Editor } from '../components/Editor';
import { FilePreview } from '../components/FilePreview';
import { useSettingsStore } from '../store/settingsStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export const EditorPage = () => {
  const { roomId = 'default-room' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = location.state?.username || 'Guest';

  const [activeTool, setActiveTool] = useState('files');
  const {
    files,
    activeFile,
    openTabs,
    createFile,
    deleteFile,
    renameFile,
    setActiveFile,
    openTab,
    closeTab,
  } = useWorkspaceStore();
  const [clients, setClients] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [mutedUserSockets, setMutedUserSockets] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [userRole, setUserRole] = useState('editor');

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const [filePreview, setFilePreview] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const editorInstanceRef = useRef(null);
  const codeRef = useRef('');
  const activeRecordingIdRef = useRef(null);
  const recentlyNotifiedJoinsRef = useRef(new Set());
  const recentlyNotifiedLeavesRef = useRef(new Set());

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
    const filesArray = doc.getArray('projectFiles');
    let initTimer = null;

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
        unique.forEach((f) => createFile(f));
        if (!unique.includes(activeFile) && unique.length > 0) {
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
  const [whiteboardElements, setWhiteboardElements] = useState([]);

  useEffect(() => {
    const wbArray = doc.getArray('whiteboardElements');
    const updateWb = () => {
      setWhiteboardElements(wbArray.toArray());
    };
    updateWb();
    wbArray.observe(updateWb);
    return () => {
      wbArray.unobserve(updateWb);
    };
  }, [doc]);

  const handleWhiteboardChange = (elements) => {
    const wbArray = doc.getArray('whiteboardElements');
    doc.transact(() => {
      wbArray.delete(0, wbArray.length);
      wbArray.push(elements);
    });
  };

  const recordEvent = async (type, author, detail) => {
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

    socket.off('connect_error');
    socket.off('connect_failed');
    socket.off(SocketActions.JOINED);
    socket.off(SocketActions.DISCONNECTED);
    socket.off(SocketActions.CHAT_HISTORY);
    socket.off(SocketActions.CHAT_BROADCAST);
    socket.off(SocketActions.RECORDING_NOTIFY);
    socket.off(SocketActions.USER_MUTE);
    socket.off(SocketActions.USER_KICK);
    socket.off(SocketActions.USER_ROLE_CHANGE);

    socket.on('connect_error', (err) => {
      console.error('socket error', err);
      toast.error('Socket connection failed, try again later.');
      navigate('/');
    });
    socket.on('connect_failed', (err) => {
      console.error('socket error', err);
      toast.error('Socket connection failed, try again later.');
      navigate('/');
    });

    socket.emit(SocketActions.JOIN, { roomId, username });

    socket.on(SocketActions.JOINED, ({ clients: updatedClients, username: joinedUser }) => {
      if (joinedUser !== username && !recentlyNotifiedJoinsRef.current.has(joinedUser)) {
        recentlyNotifiedJoinsRef.current.add(joinedUser);
        toast.success(`${joinedUser} joined the room.`, { id: `join-${joinedUser}` });
        setTimeout(() => { recentlyNotifiedJoinsRef.current.delete(joinedUser); }, 4000);
      }
      const uniqueClients = updatedClients.filter(
        (c, idx, self) => idx === self.findIndex((item) => item.username === c.username)
      );
      setClients(uniqueClients);
      recordEvent('presence', joinedUser, `${joinedUser} joined room`);
    });

    socket.on(SocketActions.DISCONNECTED, ({ socketId, username: leftUser, clients: updatedClients }) => {
      if (leftUser && !recentlyNotifiedLeavesRef.current.has(leftUser)) {
        recentlyNotifiedLeavesRef.current.add(leftUser);
        toast.success(`${leftUser} left the room.`, { id: `leave-${leftUser}` });
        setTimeout(() => { recentlyNotifiedLeavesRef.current.delete(leftUser); }, 4000);
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
    });

    socket.on(SocketActions.CHAT_HISTORY, ({ messages }) => {
      setChatMessages(messages);
    });

    socket.on(SocketActions.CHAT_BROADCAST, (msg) => {
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

    socket.on(SocketActions.RECORDING_NOTIFY, (payload) => {
      if (payload.action === 'start') {
        toast(`${payload.username} started session recording`, { icon: '🔴' });
      } else {
        toast(`${payload.username} stopped session recording`);
      }
    });

    socket.on(SocketActions.USER_MUTE, (payload) => {
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

    socket.on(SocketActions.USER_KICK, (payload) => {
      if (payload.targetSocketId === socket.id) {
        toast.error(`You were removed from the room by host ${payload.byUsername}`);
        setTimeout(() => navigate('/'), 1200);
      } else {
        toast(`${payload.targetUsername} was removed by host ${payload.byUsername}`);
        setClients((prev) => prev.filter((c) => c.socketId !== payload.targetSocketId));
      }
    });

    socket.on(SocketActions.USER_ROLE_CHANGE, (payload) => {
      if (payload.targetSocketId === socket.id) {
        setUserRole(payload.role);
        toast(`Your role was changed to ${payload.role.toUpperCase()}`, { icon: '🛡️' });
      }
      setClients((prev) =>
        prev.map((c) => (c.socketId === payload.targetSocketId ? { ...c, role: payload.role } : c))
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, username, navigate]);

  const updateEditorCode = useCallback((newCode) => {
    editorInstanceRef.current?.setCode(newCode);
    codeRef.current = newCode;
  }, []);

  const copyRoomId = useCallback(async () => {
    try {
      if (roomId) {
        await navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied to clipboard');
      }
    } catch (err) {
      toast.error('Could not copy Room ID');
    }
  }, [roomId]);

  const handleToggleTheme = useCallback(() => {
    toggleAppTheme();
    const isNextLight = appTheme === 'dark';
    updateSettings({ theme: isNextLight ? 'githubLight' : 'dracula' });
    toast.success(`Switched to ${isNextLight ? 'Light Mode' : 'Dark Mode'}`);
  }, [appTheme, toggleAppTheme, updateSettings]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toast.success('Workspace auto-saved in realtime (Yjs CRDT)');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (!username) {
    return <Navigate to="/" />;
  }

  const handleSelectFile = (path) => {
    setActiveFile(path);
  };

  const handleCreateFile = (filePath) => {
    const filesArray = doc.getArray('projectFiles');
    const trimmed = filePath.trim();
    if (!trimmed) return;
    if (!filesArray.toArray().includes(trimmed)) {
      doc.transact(() => {
        filesArray.push([trimmed]);
      });
      createFile(trimmed);
      setActiveFile(trimmed);
      toast.success(`Created file ${trimmed}`);
    }
  };

  const handleCreateFolder = (folderPath) => {
    const placeholder = `${folderPath}/index.ts`;
    handleCreateFile(placeholder);
  };

  const handleDeleteFile = (filePath) => {
    const filesArray = doc.getArray('projectFiles');
    const current = filesArray.toArray();
    const index = current.indexOf(filePath);
    if (index !== -1 && current.length > 1) {
      doc.transact(() => {
        filesArray.delete(index, 1);
        const yText = doc.getText(`file:${filePath}`);
        yText.delete(0, yText.length);
      });
      deleteFile(filePath);
      toast.success(`Deleted file ${filePath}`);
    }
  };

  const handleRenameFile = (oldPath, newPath) => {
    const filesArray = doc.getArray('projectFiles');
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
      renameFile(oldPath, newPath);
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

  const handleImportZip = async (file) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const filesArray = doc.getArray('projectFiles');
      const newPaths = [];
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

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
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

  const handleSendChatMessage = (content) => {
    if (socketRef.current) {
      socketRef.current.emit(SocketActions.CHAT_SEND, {
        roomId,
        content,
        senderName: username,
      });
    }
  };

  const handleFetchLiveKitToken = async () => {
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiHost}/api/livekit/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: roomId || 'default-room',
        participantName: username,
      }),
    });
    return await res.json();
  };

  const handleMuteUser = (targetSocketId, targetUsername, mute) => {
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

  const handleKickUser = (targetSocketId, targetUsername) => {
    socketRef.current?.emit(SocketActions.USER_KICK, {
      roomId,
      targetSocketId,
      targetUsername,
      byUsername: username,
    });
  };

  const handleRoleChange = (targetSocketId, targetUsername, role) => {
    socketRef.current?.emit(SocketActions.USER_ROLE_CHANGE, {
      roomId,
      targetSocketId,
      targetUsername,
      role,
      byUsername: username,
    });
    toast.success(`Updated role for ${targetUsername} to ${role}`);
  };

  const handleRunAiAction = async (req) => {
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

  const handleInsertAiCode = (codeSnippet) => {
    const current = codeRef.current || '';
    const updated = current ? `${current}\n\n${codeSnippet}` : codeSnippet;
    updateEditorCode(updated);
    toast.success('Inserted snippet into editor');
  };

  const handleExecuteCodeApi = async (req) => {
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiHost}/api/runner/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...req,
        roomId,
      }),
    });
    return await res.json();
  };

  const handleStartRecording = async (customTitle) => {
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

  const handleStopRecording = async (recordingId) => {
    const id = recordingId || activeRecordingIdRef.current;
    if (!id) return;
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    await fetch(`${apiHost}/api/recordings/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingId: id }),
    });
    activeRecordingIdRef.current = null;
    setIsRecording(false);

    socketRef.current?.emit(SocketActions.RECORDING_NOTIFY, {
      roomId,
      username,
      action: 'stop',
    });
    toast.success('Stopped session recording');
  };

  const leaveRoom = () => {
    navigate('/');
  };

  const handleFetchRecordings = async () => {
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiHost}/api/recordings/room/${roomId || 'default-room'}`);
    const data = await res.json();
    return data.recordings || [];
  };

  const handleDeleteRecording = async (recordingId) => {
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    await fetch(`${apiHost}/api/recordings/${recordingId}`, { method: 'DELETE' });
    toast.success('Session recording deleted');
  };

  // Command Palette Actions
  const commandPaletteActions = [
    {
      id: 'cmd-copy-room',
      title: 'Copy Room ID',
      description: 'Copy room sharing link to clipboard',
      shortcut: '⌘C',
      category: 'Collaboration',
      perform: copyRoomId,
    },
    {
      id: 'cmd-run-code',
      title: 'Run Code in Runner',
      description: 'Open code runner and execute active file',
      shortcut: '⌘↵',
      category: 'Editor',
      perform: () => setActiveTool('runner'),
    },
    {
      id: 'cmd-snippets',
      title: 'Browse Code Snippets',
      description: 'Explore and insert reusable code templates',
      category: 'Editor',
      perform: () => setActiveTool('snippets'),
    },
    {
      id: 'cmd-ai-explain',
      title: 'AI Explain Code',
      description: 'Ask AI assistant to explain active file',
      category: 'AI',
      perform: () => setActiveTool('ai'),
    },
    {
      id: 'cmd-whiteboard',
      title: 'Open Collaborative Whiteboard',
      description: 'Draw diagrams and sketch with team',
      category: 'Collaboration',
      perform: () => setActiveTool('whiteboard'),
    },
    {
      id: 'cmd-toggle-theme',
      title: 'Toggle Color Theme',
      description: 'Switch between light and dark theme mode',
      category: 'View',
      perform: handleToggleTheme,
    },
    {
      id: 'cmd-export-zip',
      title: 'Export Workspace ZIP',
      description: 'Download full workspace as ZIP archive',
      category: 'Editor',
      perform: handleExportZip,
    },
    {
      id: 'cmd-settings',
      title: 'Editor Preferences',
      description: 'Configure font size, tab size, and theme',
      category: 'View',
      perform: () => setActiveTool('settings'),
    },
    {
      id: 'cmd-leave',
      title: 'Leave Room',
      description: 'Disconnect and return to home page',
      category: 'Navigation',
      perform: leaveRoom,
    },
  ];

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
      style={{ fontFamily: settings.fontFamily, fontSize: `${Math.min(16, Math.max(11, settings.fontSize))}px` }}
      className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-gray-100"
    >
      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandPaletteActions}
      />

      {/* Presence Bar */}
      <PresenceBar
        users={presenceUsers.length > 0 ? presenceUsers : [{ socketId: 'self', username, color: '#6366f1', activeFile }]}
        currentUsername={username}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Hidden file upload input */}
      <input
        type="file"
        accept=".js,.ts,.py,.java,.cpp,.c,.txt,.html,.css,.json,.md"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* Main Resizable Panes Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" id="devmesh-editor-layout" className="h-full w-full">
          {/* File Tree Sidebar Panel */}
          <Panel id="file-tree" defaultSize={20} minSize={15} maxSize={35}>
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
          </Panel>

          <PanelResizeHandle className="flex-shrink-0 w-1.5 bg-gray-900 border-x border-gray-800/50 hover:bg-indigo-500/40 transition-all cursor-col-resize flex items-center justify-center group focus:outline-none select-none z-20">
            <div className="w-0.5 h-8 bg-gray-700 rounded-full group-hover:bg-indigo-400 transition-colors pointer-events-none" />
          </PanelResizeHandle>

          {/* Main Editor Center Panel */}
          <Panel id="editor" defaultSize={55} minSize={30}>
            <div className="flex flex-col h-full bg-gray-950">
              {/* Editor File Tab Bar */}
              <div className="flex items-center bg-gray-950 border-b border-gray-800 px-2 py-1 gap-1 overflow-x-auto">
                {(openTabs.length > 0 ? openTabs : files).map((file) => (
                  <div
                    key={file}
                    className={`group flex items-center gap-1.5 px-3 py-1 text-xs rounded-t-lg font-mono border-t border-x transition-colors cursor-pointer ${
                      activeFile === file
                        ? 'bg-gray-900 border-gray-700 text-indigo-300 font-semibold'
                        : 'bg-gray-950 border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                    onClick={() => openTab(file)}
                  >
                    <span>{file}</span>
                    {openTabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(file);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-gray-500 rounded p-0.5 text-[10px] transition-all"
                        title={`Close ${file}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-2 px-2">
                  <button
                    onClick={copyRoomId}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Copy Room ID
                  </button>
                  <button
                    onClick={leaveRoom}
                    className="px-2 py-0.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors whitespace-nowrap"
                  >
                    Leave
                  </button>
                </div>
              </div>

              {/* File Diff Preview */}
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
            </div>
          </Panel>

          <PanelResizeHandle className="flex-shrink-0 w-1.5 bg-gray-900 border-x border-gray-800/50 hover:bg-indigo-500/40 transition-all cursor-col-resize flex items-center justify-center group focus:outline-none select-none z-20">
            <div className="w-0.5 h-8 bg-gray-700 rounded-full group-hover:bg-indigo-400 transition-colors pointer-events-none" />
          </PanelResizeHandle>

          {/* Right Tools & Customization Panel */}
          <Panel id="tools" defaultSize={25} minSize={18} maxSize={45}>
            <div className="flex h-full">
              <ToolsPanel
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                unreadCount={0}
                onlineUsersCount={clients.length || 1}
              />
              {activeTool && (
                <div className="flex-1 h-full overflow-hidden flex flex-col bg-gray-950 border-l border-gray-800">
                  {activeTool === 'files' && (
                    <div className="h-full flex items-center justify-center text-xs text-gray-500 p-4 text-center">
                      File tree is on the left panel
                    </div>
                  )}
                  {activeTool === 'runner' && (
                    <CodeRunnerPanel
                      currentCode={codeRef.current}
                      activeFilePath={activeFile}
                      language={settings.language}
                      onExecuteCode={handleExecuteCodeApi}
                    />
                  )}
                  {activeTool === 'snippets' && (
                    <SnippetsPanel onInsertCode={handleInsertAiCode} />
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
                      onRoleChange={handleRoleChange}
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
                      onDeleteRecording={handleDeleteRecording}
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
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        activeFile={activeFile}
        language={settings.language}
        tabSize={settings.tabSize}
        roomId={roomId}
        onlineCount={clients.length || 1}
        syncStatus="synced"
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
    </div>
  );
};

export default EditorPage;
