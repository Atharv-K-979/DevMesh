import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WhiteboardPanel } from '@devmesh/ui';

export const WhiteboardPage: React.FC = () => {
  const { roomId = 'default-room' } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-gray-100 overflow-hidden">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/editor/${roomId}`)}
            className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            ← Back to Editor
          </button>
          <span className="text-sm font-semibold text-gray-200">
            Whiteboard: {roomId}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <WhiteboardPanel />
      </div>
    </div>
  );
};

export default WhiteboardPage;
