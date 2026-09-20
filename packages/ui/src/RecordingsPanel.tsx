import React, { useState } from 'react';
import { SessionRecording } from '@devmesh/shared-types';

interface RecordingsPanelProps {
  recordings: SessionRecording[];
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording?: (recording: SessionRecording) => void;
}

export const RecordingsPanel: React.FC<RecordingsPanelProps> = ({
  recordings,
  isRecording,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
}) => {
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">Session Recordings</span>
        <span className="text-xs font-mono text-gray-500">{recordings.length} saved</span>
      </div>

      <div className="p-3 border-b border-gray-800">
        {isRecording ? (
          <button
            onClick={onStopRecording}
            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            Stop Recording Session
          </button>
        ) : (
          <button
            onClick={onStartRecording}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Start New Recording
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {recordings.length === 0 ? (
          <div className="text-center text-xs text-gray-500 italic py-8">
            No session recordings yet. Start a recording to capture code changes and chat history.
          </div>
        ) : (
          recordings.map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-semibold text-gray-200">{rec.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1 font-mono">
                  <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{formatDuration(rec.durationSeconds)}</span>
                  <span>•</span>
                  <span>{rec.eventCount} events</span>
                </div>
              </div>

              {onPlayRecording && (
                <button
                  onClick={() => onPlayRecording(rec)}
                  className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors"
                >
                  Replay
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
