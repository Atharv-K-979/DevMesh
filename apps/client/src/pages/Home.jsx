import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Home = () => {
  const navigate = useNavigate();
  const { user, login } = useAuthStore();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
    const saved = localStorage.getItem('devmesh_recent_rooms');
    if (saved) {
      try {
        setRecentRooms(JSON.parse(saved).slice(0, 4));
      } catch (e) {
        // Ignore localStorage error
      }
    }
  }, [user]);

  const saveRecentRoom = (id) => {
    const updated = [id, ...recentRooms.filter((r) => r !== id)].slice(0, 4);
    setRecentRooms(updated);
    localStorage.setItem('devmesh_recent_rooms', JSON.stringify(updated));
  };

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success('Generated a new room ID');
  };

  const joinRoom = async (overrideRoomId) => {
    const targetRoom = (overrideRoomId || roomId).trim();
    const targetUser = username.trim();

    if (!targetRoom || !targetUser) {
      toast.error('Room ID & username are required');
      return;
    }

    saveRecentRoom(targetRoom);
    await login(targetUser);

    navigate(`/editor/${targetRoom}`, {
      state: { username: targetUser },
    });
  };

  const handleInputEnter = (e) => {
    if (e.key === 'Enter') {
      joinRoom();
    }
  };

  const features = [
    { title: 'Yjs CRDT Realtime', desc: 'Conflict-free collaborative editor synchronized with sub-10ms latency.' },
    { title: 'AI Pair Programmer', desc: 'Context-aware Claude & GPT completions for explaining, refactoring, and fixing code.' },
    { title: 'Interactive Code Runner', desc: 'In-browser sandbox execution with custom standard input and console logging.' },
    { title: 'Synced Whiteboard', desc: 'Collaborative vector canvas with shapes, pencil, eraser, and PNG export.' },
  ];

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-950 text-gray-100 p-6 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 font-mono text-sm">
            &lt;/&gt;
          </div>
          <div>
            <span className="text-base font-bold text-gray-100 tracking-tight">DevMesh</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
              v2.0
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Realtime Node Active
          </span>
        </div>
      </header>

      {/* Main Form Center Card */}
      <main className="w-full max-w-md my-auto py-8">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl shadow-black/60 flex flex-col items-center backdrop-blur">
          <h2 className="text-xl font-bold tracking-tight text-gray-100 text-center">
            Collaborative Code Workspace
          </h2>
          <p className="text-xs text-gray-400 mt-2 mb-6 text-center leading-relaxed">
            Create a collaborative session or join teammates with a room ID
          </p>

          <div className="w-full space-y-3.5">
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">Room Identifier</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3.5 py-2.5 bg-gray-950 border border-gray-700/80 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                  placeholder="Paste or enter Room ID"
                  onChange={(e) => setRoomId(e.target.value)}
                  value={roomId}
                  onKeyUp={handleInputEnter}
                />
                <button
                  type="button"
                  onClick={createNewRoom}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700 transition-colors shrink-0"
                  title="Generate new UUID room"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">Your Name</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700/80 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                placeholder="e.g. Alice"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                onKeyUp={handleInputEnter}
              />
            </div>

            <button
              onClick={() => joinRoom()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 text-xs mt-2"
            >
              Enter Collaboration Room →
            </button>

            {/* Recent rooms quick list */}
            {recentRooms.length > 0 && (
              <div className="pt-2 border-t border-gray-800">
                <span className="text-[10px] font-mono text-gray-500 block mb-1.5">Recent Rooms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {recentRooms.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRoomId(r);
                        if (username) joinRoom(r);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-indigo-300 border border-gray-800 text-[10px] font-mono truncate max-w-[150px] transition-colors"
                      title={r}
                    >
                      {r.slice(0, 8)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature Grid Highlight */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {features.map((f) => (
            <div key={f.title} className="p-3 rounded-xl bg-gray-900/40 border border-gray-850">
              <h4 className="text-xs font-semibold text-gray-200">{f.title}</h4>
              <p className="text-[10px] text-gray-500 mt-1 leading-normal">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500 font-mono">
        <span>DevMesh Platform</span>
        <span>Realtime CRDT • Hocuspocus • CodeMirror • WebRTC</span>
      </footer>
    </div>
  );
};

export default Home;
