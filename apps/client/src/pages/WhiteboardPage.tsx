import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WhiteboardPanel } from '@devmesh/ui';
import { WhiteboardElement } from '@devmesh/shared-types';

export const WhiteboardPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const username = searchParams.get('username') || 'Guest';

  // Connect to the room Yjs doc & Hocuspocus collaboration server
  const { doc } = useMemo(() => {
    const ydoc = new Y.Doc();
    const wsUrl = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:1234';
    new HocuspocusProvider({
      url: wsUrl,
      name: roomId || 'default-room',
      document: ydoc,
    });
    new IndexeddbPersistence(roomId || 'default-room', ydoc);
    return { doc: ydoc };
  }, [roomId]);

  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);

  useEffect(() => {
    const wbArray = doc.getArray<WhiteboardElement>('whiteboardElements');
    const updateWb = () => {
      setWhiteboardElements(wbArray.toArray());
    };
    updateWb();
    wbArray.observe(updateWb);
    return () => {
      wbArray.unobserve(updateWb);
    };
  }, [doc]);

  const handleElementsChange = (elements: WhiteboardElement[]) => {
    const wbArray = doc.getArray<WhiteboardElement>('whiteboardElements');
    doc.transact(() => {
      wbArray.delete(0, wbArray.length);
      wbArray.push(elements);
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Header bar */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs text-white">
            WB
          </div>
          <div>
            <h1 className="text-xs font-bold text-gray-200">
              Collaborative Whiteboard — <span className="text-indigo-400 font-mono">{roomId}</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono">
              Synced Realtime with Room Participants ({username})
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.opener) {
              window.close();
            } else {
              navigate(`/editor/${roomId}`, { state: { username } });
            }
          }}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg border border-gray-700 transition-colors"
        >
          Return to Editor
        </button>
      </div>

      {/* Main Canvas View */}
      <div className="flex-1 w-full h-full overflow-hidden">
        <WhiteboardPanel
          elements={whiteboardElements}
          onElementsChange={handleElementsChange}
        />
      </div>
    </div>
  );
};

export default WhiteboardPage;
