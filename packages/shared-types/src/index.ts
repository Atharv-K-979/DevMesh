// Socket actions and events
export enum SocketActions {
  JOIN = 'join',
  JOINED = 'joined',
  DISCONNECTED = 'disconnected',
  LEAVE = 'leave',
  CODE_CHANGE = 'code-change',
  SYNC_CODE = 'sync-code',
  CHAT_SEND = 'chat-message:send',
  CHAT_BROADCAST = 'chat-message:broadcast',
  CHAT_HISTORY = 'chat-history',
  RECORDING_NOTIFY = 'recording-notify',
  USER_MUTE = 'user-mute',
  USER_KICK = 'user-kick',
  USER_ROLE_CHANGE = 'user-role-change',
  FILE_TREE_UPDATE = 'file-tree:update',
  CURSOR_AWARENESS = 'cursor-awareness',
  CURSOR_MOVE = 'cursor-move',
  CODE_EXECUTE = 'code:execute',
  CODE_EXECUTE_RESULT = 'code:execute-result',
}

// User and Session definitions
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id?: string;
  socketId: string;
  username: string;
  email?: string;
  role?: UserRole;
  color?: string;
}

export interface ClientInfo {
  socketId: string;
  username: string;
  role?: UserRole;
  joinedAt?: number;
  color?: string;
}

export interface RoomParticipant extends ClientInfo {
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
}

export interface RoomSettings {
  isPrivate?: boolean;
  allowGuests?: boolean;
  defaultRole?: UserRole;
  language?: string;
  maxParticipants?: number;
}

export interface Room {
  roomId: string;
  name?: string;
  ownerId?: string;
  users: User[];
  createdAt?: number;
  settings?: RoomSettings;
}

// Socket Payloads
export interface JoinPayload {
  roomId: string;
  username: string;
  role?: UserRole;
}

export interface JoinedPayload {
  clients: ClientInfo[];
  username: string;
  socketId: string;
  role?: UserRole;
}

export interface DisconnectedPayload {
  socketId: string;
  username: string;
  clients?: ClientInfo[];
}

export interface CodeChangePayload {
  roomId: string;
  code: string;
  filePath?: string;
}

export interface SyncCodePayload {
  socketId: string;
  code: string;
  filePath?: string;
}

export interface CursorPosition {
  line: number;
  column: number;
  filePath?: string;
}

export interface CursorMovePayload {
  roomId: string;
  socketId: string;
  username: string;
  color: string;
  cursor: CursorPosition;
}

export interface RoleChangePayload {
  roomId: string;
  targetSocketId: string;
  targetUsername: string;
  role: UserRole;
  byUsername: string;
}

// Chat and Messaging
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  mentions?: string[];
  reactions?: Record<string, string[]>; // emoji -> usernames[]
}

export interface SendChatMessagePayload {
  roomId: string;
  content: string;
  senderName: string;
  mentions?: string[];
}

export interface ChatHistoryPayload {
  messages: ChatMessage[];
}

// File System and Project Workspace
export type FileType = 'file' | 'directory';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileType;
  children?: FileNode[];
  content?: string;
  size?: number;
  updatedAt?: number;
}

export interface ProjectWorkspace {
  id: string;
  roomId: string;
  name: string;
  root: FileNode;
  activeFileId?: string;
}

export interface CreateFilePayload {
  roomId: string;
  parentPath: string;
  name: string;
  type: FileType;
}

export interface DeleteFilePayload {
  roomId: string;
  path: string;
}

export interface RenameFilePayload {
  roomId: string;
  oldPath: string;
  newPath: string;
}

// WebRTC and LiveKit
export interface LiveKitTokenRequest {
  roomName: string;
  participantName: string;
  role?: UserRole;
}

export interface LiveKitTokenResponse {
  token: string;
  wsUrl: string;
  isConfigured: boolean;
}

// Session Recording and Replay
export type RecordingEventType = 'code' | 'chat' | 'presence' | 'whiteboard' | 'file' | 'execution';

export interface RecordingEvent {
  timestamp: number;
  type: RecordingEventType;
  author: string;
  detail: string;
  data?: Record<string, any>;
}

export interface SessionRecording {
  id: string;
  roomId: string;
  title: string;
  createdAt: number;
  durationSeconds: number;
  eventCount: number;
  events: RecordingEvent[];
  s3Key?: string;
}

export interface StartRecordingRequest {
  roomId: string;
  title?: string;
}

export interface StopRecordingRequest {
  recordingId: string;
}

export interface RecordingListResponse {
  recordings: SessionRecording[];
}

// AI Pair Programmer
export type AiProvider = 'anthropic' | 'openai';
export type AiAction = 'explain' | 'generate' | 'refactor' | 'fix';

export interface AiCompletionRequest {
  prompt: string;
  contextCode?: string;
  language?: string;
  action?: AiAction;
  provider?: AiProvider;
  model?: string;
}

export interface AiCompletionResponse {
  result: string;
  action: string;
  timestamp: number;
  provider?: string;
}

// Collaborative Whiteboard
export type WhiteboardTool = 'pencil' | 'line' | 'rectangle' | 'circle' | 'text' | 'eraser';

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  type: WhiteboardTool;
  points?: WhiteboardPoint[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  fill?: boolean;
}

export interface WhiteboardState {
  elements: WhiteboardElement[];
}

// CRDT & Document Persistence
export interface RoomSnapshotDTO {
  roomId: string;
  documentName: string;
  snapshot: string; // Base64 encoded uint8array state
  updatedAt: number;
}

// Authentication
export interface AuthLoginRequest {
  username: string;
  password?: string;
}

export interface AuthLoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role?: UserRole;
  };
}

// Code Execution & Runner
export interface CodeExecutionRequest {
  language: string;
  code: string;
  input?: string;
  roomId?: string;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timestamp: number;
}

// Code Snippets
export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  tags: string[];
  author?: string;
  createdAt: number;
}

// Command Palette Actions
export interface CommandPaletteAction {
  id: string;
  title: string;
  description?: string;
  shortcut?: string;
  category: 'Editor' | 'Collaboration' | 'Navigation' | 'View' | 'AI';
  icon?: string;
  perform: () => void;
}
