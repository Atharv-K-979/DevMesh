import React, { useState } from 'react';
import { ClientInfo } from '@devmesh/shared-types';

interface UsersPanelProps {
  clients: ClientInfo[];
  currentUsername: string;
  creatorUsername?: string;
  mutedUserSockets?: string[];
  onMuteUser?: (targetSocketId: string, targetUsername: string, mute: boolean) => void;
  onKickUser?: (targetSocketId: string, targetUsername: string) => void;
}

export const UsersPanel: React.FC<UsersPanelProps> = ({
  clients,
  currentUsername,
  creatorUsername,
  mutedUserSockets = [],
  onMuteUser,
  onKickUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isCurrentUserAdmin = creatorUsername ? currentUsername === creatorUsername : true;

  const filteredClients = clients.filter((client) =>
    client.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Participants</span>
        <span className="text-xs font-mono text-gray-500">{clients.length} online</span>
      </div>

      <div className="p-2 border-b border-gray-800">
        <input
          type="text"
          placeholder="Filter participants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredClients.map((client) => {
          const isSelf = client.username === currentUsername;
          const isOwner = client.username === creatorUsername;
          const isMuted = mutedUserSockets.includes(client.socketId);

          return (
            <div
              key={client.socketId}
              className="flex items-center justify-between p-2 rounded-xl bg-gray-900/40 hover:bg-gray-900 border border-gray-850 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                  style={{ backgroundColor: client.color || '#6366f1' }}
                >
                  {client.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-200">{client.username}</span>
                    {isSelf && <span className="text-[9px] text-gray-500 font-mono">(You)</span>}
                  </div>
                  {isOwner && (
                    <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">
                      Room Admin
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isCurrentUserAdmin && !isSelf && (
                  <>
                    {onMuteUser && (
                      <button
                        onClick={() => onMuteUser(client.socketId, client.username, !isMuted)}
                        className={`p-1 rounded text-xs transition-colors ${
                          isMuted ? 'bg-red-500/20 text-red-400' : 'hover:bg-gray-800 text-gray-400'
                        }`}
                        title={isMuted ? 'Unmute User' : 'Mute User'}
                      >
                        {isMuted ? 'Muted' : 'Mute'}
                      </button>
                    )}
                    {onKickUser && (
                      <button
                        onClick={() => onKickUser(client.socketId, client.username)}
                        className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded text-xs transition-colors"
                        title="Remove Participant"
                      >
                        Kick
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
