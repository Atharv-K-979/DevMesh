import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const createNewRoom = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success('Created a new room ID');
  };

  const joinRoom = () => {
    if (!roomId.trim() || !username.trim()) {
      toast.error('Room ID & username are required');
      return;
    }

    navigate(`/editor/${roomId.trim()}`, {
      state: { username: username.trim() },
    });
  };

  const handleInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      joinRoom();
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/20">
              &lt;/&gt;
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-100">DevMesh</h2>
          </div>
          <h4 className="text-sm font-medium text-gray-400 mb-6 text-center">
            Generate new collaboration room or join with existing ID
          </h4>
          <div className="w-full space-y-4">
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Room ID"
              onChange={(e) => setRoomId(e.target.value)}
              value={roomId}
              onKeyUp={handleInputEnter}
            />
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              onKeyUp={handleInputEnter}
            />
            <button
              onClick={joinRoom}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 text-sm"
            >
              Enter Room
            </button>
            <p className="text-xs text-gray-400 text-center pt-2">
              Don't have a room? Create a &nbsp;
              <a
                onClick={createNewRoom}
                href="#"
                className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors"
              >
                new room
              </a>
            </p>
          </div>
        </div>
      </div>
      <footer className="py-4 text-xs text-gray-500">
        DevMesh — Realtime Collaborative Code Editor
      </footer>
    </div>
  );
};

export default Home;
