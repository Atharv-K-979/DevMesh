import React, { useState } from 'react';

export const UsersPanel = ({
  clients = [],
  currentUsername,
  creatorUsername,
  mutedUserSockets = [],
  onMuteUser,
  onMuteAll,
  onKickUser,
  onRoleChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isCurrentUserAdmin = creatorUsername ? currentUsername === creatorUsername : true;

  const filteredClients = clients.filter((client) =>
    client.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKickWithConfirm = (socketId, targetUsername) => {
    if (window.confirm(`Are you sure you want to remove ${targetUsername} from the room?`)) {
      onKickUser?.(socketId, targetUsername);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Participants & Roles</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-gray-500">{clients.length} online</span>
          {mutedUserSockets.length > 0 && (
            <span className="text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded">
              {mutedUserSockets.length} muted
            </span>
          )}
        </div>
      </div>

      {/* Admin Action Toolbar */}
      {isCurrentUserAdmin && clients.length > 1 && onMuteAll && (
        <div className="px-3 py-1.5 bg-gray-900 border-b border-gray-800 flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono text-gray-400">Admin Actions:</span>
          <button
            onClick={onMuteAll}
            className="px-2 py-0.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded text-[10px] font-semibold transition-colors"
          >
            Mute All Members
          </button>
        </div>
      )}

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
          const currentRole = client.role || (isOwner ? 'admin' : 'editor');

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
                  <div className="flex items-center gap-1 mt-0.5">
                    {isOwner ? (
                      <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">
                        Room Admin
                      </span>
                    ) : (
                      <span className={`text-[9px] font-mono px-1 rounded uppercase ${
                        currentRole === 'admin'
                          ? 'bg-amber-500/20 text-amber-300'
                          : currentRole === 'editor'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {currentRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isMuted && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                    Muted
                  </span>
                )}

                {isCurrentUserAdmin && !isSelf && onRoleChange && (
                  <select
                    value={currentRole}
                    onChange={(e) => onRoleChange(client.socketId, client.username, e.target.value)}
                    className="bg-gray-950 border border-gray-800 text-gray-300 text-[10px] rounded px-1 py-0.5 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                )}

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
                        {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                    )}
                    {onKickUser && (
                      <button
                        onClick={() => handleKickWithConfirm(client.socketId, client.username)}
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
