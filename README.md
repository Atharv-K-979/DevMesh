# DevMesh

DevMesh is a high-performance realtime collaborative development environment and code editor. It enables distributed teams to program together synchronously with Conflict-free Replicated Data Types (CRDTs), low-latency audio/video communication, interactive whiteboards, and intelligent AI pair-programming assistants.

## Architecture Overview

DevMesh is architected as an event-driven monorepo separating concerns across client, API, collaboration, and shared libraries:

```
devmesh/
├── apps/
│   ├── client/          # Vite + React + TypeScript + Tailwind frontend
│   ├── api/             # NestJS REST & WebSocket API gateway
│   └── collab/          # Hocuspocus CRDT synchronization server
├── packages/
│   ├── shared-types/    # Shared TypeScript contracts, DTOs, and schemas
│   └── ui/              # Design system and reusable collaboration panels
└── infra/               # Docker Compose infrastructure definitions
```

### Core Architecture Components

1. **Client (`apps/client`)**: React SPA powered by Vite, Tailwind CSS, Zustand, and CodeMirror 6. Connects to Hocuspocus over WebSockets for CRDT editor synchronization and NestJS for room and signaling events.
2. **API Gateway (`apps/api`)**: NestJS backend managing authentication, room lifecycle, participant states, LiveKit token generation, AI inference coordination, and metadata persistence.
3. **Collaboration Engine (`apps/collab`)**: Hocuspocus server backed by Yjs CRDTs for deterministic concurrent document editing and awareness propagation (cursors, selections, active files).
4. **Shared Types (`packages/shared-types`)**: Source of truth for network protocols, socket payloads, recording structures, and state definitions.
5. **UI Package (`packages/ui`)**: Modular components for chat, participants, audio/video calls, file trees, whiteboards, and AI assistant panels.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, CodeMirror 6, Lucide Icons, React Resizable Panels
- **Backend**: NestJS, TypeScript, Socket.IO, LiveKit Server SDK
- **Realtime & CRDT**: Yjs, Hocuspocus (`@hocuspocus/server`, `@hocuspocus/provider`), y-codemirror.next
- **Media & Streaming**: LiveKit WebRTC (Audio, Video, Screen Sharing)
- **AI Assistants**: OpenAI API, Anthropic Claude API
- **Persistence & Caching**: PostgreSQL, Redis, S3/MinIO compatible object storage
- **Monorepo Tooling**: Turborepo, pnpm workspaces

## Features

- **Realtime Collaborative Code Editing**: Sub-millisecond CRDT synchronization powered by Yjs and Hocuspocus.
- **Collaborative Presence & Awareness**: Visual indicators of remote cursors, selections, and user activity.
- **Multi-File Workspace**: Hierarchical file tree with support for file/folder creation, deletion, rename, and tabbed browsing.
- **Syntax Highlighting & Formatting**: CodeMirror 6 extensions supporting multiple programming languages.
- **Integrated WebRTC Communication**: High-fidelity audio, video, and screen sharing via LiveKit.
- **Collaborative Whiteboard**: Multi-user canvas with freehand pencil, shapes, text tools, and PNG export.
- **In-Room Chat**: Realtime markdown messaging, username mentions, and notification alerts.
- **AI Pair Programmer**: Dual provider support (OpenAI and Anthropic) for code explanation, refactoring, bug fixing, and generation.
- **Session Recording & Replay**: Capture editing sessions and playback chronological timeline events.
- **Project Import/Export**: Export workspaces to ZIP and import existing archives.
- **Theme Modes**: Full dark mode and light mode color schemes.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Docker and Docker Compose

### Environment Configuration

The monorepo uses environment files for configuration:

- `.env.example`: Reference template containing all variable names and safe defaults.
- `.env.local`: Local development configuration with working endpoints for local services.
- `.env`: Machine-specific deployment settings (kept uncommitted).

Key environment variables:

| Variable | Default (Local) | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3001` | HTTP port for NestJS API Gateway |
| `COLLAB_PORT` | `1234` | WebSocket port for Hocuspocus CRDT Server |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/devmesh` | PostgreSQL database connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL for presence and cache |
| `LIVEKIT_URL` | `ws://localhost:7880` | LiveKit media server URL |
| `LIVEKIT_API_KEY` | `devkey` | LiveKit server API key |
| `LIVEKIT_API_SECRET` | `secret` | LiveKit server API secret |
| `OPENAI_API_KEY` | `sk-placeholder` | OpenAI API key for AI assistant features |
| `ANTHROPIC_API_KEY` | `sk-ant-placeholder` | Anthropic Claude API key for AI assistant |
| `VITE_API_URL` | `http://localhost:3001` | Client API endpoint |
| `VITE_COLLAB_WS_URL` | `ws://localhost:1234` | Client Hocuspocus WebSocket endpoint |

### Infrastructure Setup

Start the local backing services (PostgreSQL, Redis, MinIO, LiveKit):

```bash
docker compose up -d
```

### Installation

Install monorepo dependencies:

```bash
pnpm install
```

### Development Commands

Run all applications and packages concurrently in watch mode:

```bash
pnpm run dev
```

Target specific services:

```bash
pnpm --filter @devmesh/api dev       # Start NestJS API
pnpm --filter @devmesh/collab dev    # Start Hocuspocus server
pnpm --filter @devmesh/client dev    # Start React client
```

Build all packages:

```bash
pnpm run build
```

Run test suites:

```bash
pnpm run test
```

Target specific test suites:

```bash
pnpm --filter @devmesh/api test      # Run Vitest API unit tests
pnpm --filter @devmesh/collab test   # Run Vitest collaboration server tests
```

Lint workspace packages:

```bash
pnpm run lint
```

Format codebase:

```bash
pnpm run format
```

## Services & Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| Client | `http://localhost:5173` | React frontend application |
| API Gateway | `http://localhost:3001` | NestJS REST & WebSocket API |
| Collab Server | `ws://localhost:1234` | Hocuspocus Yjs WebSocket server |
| PostgreSQL | `localhost:5432` | Relational metadata persistence |
| Redis | `localhost:6379` | Ephemeral presence & cache store |
| MinIO S3 | `http://localhost:9000` | S3-compatible recording storage |
| LiveKit WebRTC | `ws://localhost:7880` | LiveKit media transport server |

## API Overview

### Authentication
- `POST /api/auth/login`: Authenticate or generate user session token
- `GET /api/auth/verify`: Validate bearer token header

### Signaling & Media Call
- `POST /api/livekit/token`: Generate signed WebRTC access token for room participant

### AI Pair Programmer
- `POST /api/ai/completion`: Request code explanation, generation, refactoring, or bug fixing

### Session Recordings
- `POST /api/recordings/start`: Initiate a new recording session
- `POST /api/recordings/stop`: Finalize session recording
- `POST /api/recordings/event`: Ingest timeline event (code keystrokes, chat messages)
- `GET /api/recordings/room/:roomId`: List recordings for a given room
- `GET /api/recordings/:id`: Retrieve recording detail and full event history

### Document Persistence
- `POST /api/persistence/snapshot`: Persist CRDT document state snapshot
- `GET /api/persistence/snapshot/:roomId/:documentName`: Retrieve document snapshot

### Realtime WebSockets
- `ws://localhost:1234`: Hocuspocus Yjs CRDT synchronization and awareness
- `ws://localhost:3001/socket.io`: Room membership, realtime chat messages, mute, and kick events

## License

MIT License
