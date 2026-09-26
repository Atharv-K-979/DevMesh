import React, { useState, useEffect } from 'react';

const PlayIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export const RecordingsPanel = ({
  recordings: initialRecordings = [],
  isRecording,
  onStartRecording,
  onStopRecording,
  onDeleteRecording,
  onReplayCodeChange,
}) => {
  const [recordings, setRecordings] = useState(initialRecordings);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    setRecordings(initialRecordings);
  }, [initialRecordings]);

  // Playback timer
  useEffect(() => {
    let timer;
    if (isPlaying && selectedRecording) {
      timer = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= selectedRecording.durationSeconds) {
            setIsPlaying(false);
            return selectedRecording.durationSeconds;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, selectedRecording, playbackSpeed]);

  const visibleEvents = selectedRecording
    ? selectedRecording.events.filter((e) => e.timestamp <= playbackTime)
    : [];

  // Emit code change during replay
  useEffect(() => {
    if (isPlaying && selectedRecording && onReplayCodeChange) {
      const codeEvents = visibleEvents.filter((e) => e.type === 'code');
      if (codeEvents.length > 0) {
        const latest = codeEvents[codeEvents.length - 1];
        if (latest && latest.detail) {
          onReplayCodeChange(latest.detail);
        }
      }
    }
  }, [playbackTime, isPlaying, selectedRecording, onReplayCodeChange]);

  const handleStart = () => {
    onStartRecording(titleInput || undefined);
    setTitleInput('');
  };

  const handleStop = () => {
    onStopRecording();
  };

  const handleDelete = (id) => {
    if (selectedRecording?.id === id) {
      setSelectedRecording(null);
      setIsPlaying(false);
    }
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    if (onDeleteRecording) {
      onDeleteRecording(id);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Session Recordings</span>
        <span className="text-xs font-mono text-gray-500">{recordings.length} saved</span>
      </div>

      <div className="p-3 border-b border-gray-800 space-y-2">
        {isRecording ? (
          <button
            onClick={handleStop}
            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            Stop Recording Session
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Recording Title (optional)"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleStart}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Start New Recording
            </button>
          </div>
        )}
      </div>

      {/* Selected Recording Replay Viewport */}
      {selectedRecording && (
        <div className="p-3 bg-gray-900 border-b border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-indigo-400 truncate">{selectedRecording.title}</h4>
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date(selectedRecording.createdAt).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedRecording(null);
                setIsPlaying(false);
              }}
              className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] rounded font-mono"
            >
              Close
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>{formatTime(playbackTime)}</span>
              <span>{formatTime(selectedRecording.durationSeconds)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={selectedRecording.durationSeconds}
              value={playbackTime}
              onChange={(e) => setPlaybackTime(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                if (playbackTime >= selectedRecording.durationSeconds) {
                  setPlaybackTime(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="flex items-center gap-1">
              {[0.5, 1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recordings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {recordings.length === 0 ? (
          <div className="text-center text-xs text-gray-500 italic py-8">
            No session recordings yet. Start a recording to capture code changes and chat history.
          </div>
        ) : (
          recordings.map((rec) => (
            <div
              key={rec.id}
              onClick={() => {
                setSelectedRecording(rec);
                setPlaybackTime(0);
                setIsPlaying(true);
              }}
              className={`p-3 rounded-xl bg-gray-900/60 border cursor-pointer hover:border-gray-700 transition-colors flex items-center justify-between ${
                selectedRecording?.id === rec.id ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-gray-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-gray-200 truncate">{rec.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1 font-mono">
                  <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{formatTime(rec.durationSeconds)}</span>
                  <span>•</span>
                  <span>{rec.eventCount} events</span>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecording(rec);
                    setPlaybackTime(0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs transition-colors"
                  title="Replay"
                >
                  <PlayIcon />
                </button>
                {onDeleteRecording && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rec.id);
                    }}
                    className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs transition-colors"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
