import React, { useState } from 'react';

const MicIcon = ({ active }) => (
  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    {active ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V6a3 3 0 00-6 0v6.75a3 3 0 003 3z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V6a3 3 0 00-6 0v6.75a3 3 0 003 3zM3 3l18 18" />
    )}
  </svg>
);

const CameraIcon = ({ active }) => (
  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    {active ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25zM3 3l18 18" />
    )}
  </svg>
);

const ScreenShareIcon = () => (
  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" />
  </svg>
);

export const CallPanel = ({ roomId, username, onFetchToken }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoinCall = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await onFetchToken();
      if (!res?.isConfigured) {
        setError('LiveKit media server is not currently configured.');
      }
      setIsInCall(true);
    } catch (err) {
      setError(err?.message || 'Failed to connect to media session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setIsSharing(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Media Call</span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isInCall ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400'}`}>
          {isInCall ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error && (
          <div className="mb-4 p-2.5 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg max-w-xs text-center">
            {error}
          </div>
        )}

        {!isInCall ? (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <CameraIcon active={true} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-200">Voice & Video Call</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Join the audio/video call for room {roomId}</p>
            </div>
            <button
              onClick={handleJoinCall}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
            >
              {isLoading ? 'Connecting...' : 'Join Call'}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Participant Video & Screen Share Stage */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
              {isSharing && (
                <div className="bg-gray-900 border border-indigo-500/50 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      You are sharing your screen
                    </span>
                    <button
                      onClick={() => setIsSharing(false)}
                      className="px-2 py-0.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded text-[10px] font-mono transition-colors"
                    >
                      Stop Sharing
                    </button>
                  </div>
                  <div className="w-full h-32 bg-gray-950/80 rounded-lg border border-gray-800 flex items-center justify-center flex-col gap-1 text-gray-500">
                    <ScreenShareIcon />
                    <span className="text-[10px] font-mono">DevMesh Screen Stream Active</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 flex-1 items-center">
                <div className="h-36 bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-2 shadow-sm">
                    {username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-300">{username} (You)</span>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span className={isMicOn ? 'text-emerald-400' : 'text-red-400'}>
                      {isMicOn ? '● Audio Active' : '● Muted'}
                    </span>
                    <span>{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Control Dock */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-800">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isMicOn ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-750' : 'bg-red-500/20 border-red-500/30 text-red-400'
                }`}
                title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                <MicIcon active={isMicOn} />
              </button>

              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isCameraOn ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-750' : 'bg-red-500/20 border-red-500/30 text-red-400'
                }`}
                title={isCameraOn ? 'Stop Camera' : 'Start Camera'}
              >
                <CameraIcon active={isCameraOn} />
              </button>

              <button
                onClick={() => setIsSharing(!isSharing)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isSharing ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-750'
                }`}
                title="Share Screen"
              >
                <ScreenShareIcon />
              </button>

              <button
                onClick={handleLeaveCall}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-sm transition-colors"
                title="Leave Call"
              >
                <PhoneOffIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
