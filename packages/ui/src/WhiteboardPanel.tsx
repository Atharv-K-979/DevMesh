import React, { useRef, useState, useEffect } from 'react';
import { WhiteboardElement, WhiteboardTool } from '@devmesh/shared-types';

interface WhiteboardPanelProps {
  elements?: WhiteboardElement[];
  onElementsChange?: (elements: WhiteboardElement[]) => void;
}

export const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({
  elements: initialElements = [],
  onElementsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [elements, setElements] = useState<WhiteboardElement[]>(initialElements);
  const [tool, setTool] = useState<WhiteboardTool>('pencil');
  const [color, setColor] = useState('#6366f1');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);

  const colors = ['#ffffff', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  useEffect(() => {
    setElements(initialElements);
  }, [initialElements]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const all = [...elements, ...(currentElement ? [currentElement] : [])];

    all.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'eraser') {
        ctx.strokeStyle = '#030712'; // canvas bg color
      }

      if (el.type === 'pencil' || el.type === 'eraser') {
        if (el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          el.points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (
        el.type === 'rectangle' &&
        el.x !== undefined &&
        el.y !== undefined &&
        el.width !== undefined &&
        el.height !== undefined
      ) {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (
        el.type === 'circle' &&
        el.x !== undefined &&
        el.y !== undefined &&
        el.width !== undefined &&
        el.height !== undefined
      ) {
        ctx.beginPath();
        const radius = Math.sqrt(el.width ** 2 + el.height ** 2) / 2;
        ctx.arc(el.x + el.width / 2, el.y + el.height / 2, Math.abs(radius), 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === 'text' && el.x !== undefined && el.y !== undefined && el.text) {
        ctx.font = `${el.strokeWidth * 6}px sans-serif`;
        ctx.fillText(el.text, el.x, el.y);
      }
      ctx.restore();
    });
  };

  useEffect(() => {
    redrawCanvas();
  }, [elements, currentElement]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
      const text = window.prompt('Enter text to place on whiteboard:');
      if (text && text.trim()) {
        const newEl: WhiteboardElement = {
          id: Math.random().toString(36).substring(7),
          type: 'text',
          x,
          y,
          text: text.trim(),
          color,
          strokeWidth,
        };
        const updated = [...elements, newEl];
        setElements(updated);
        if (onElementsChange) {
          onElementsChange(updated);
        }
      }
      return;
    }

    setIsDrawing(true);
    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentElement({
        id: Math.random().toString(36).substring(7),
        type: tool,
        points: [{ x, y }],
        color: tool === 'eraser' ? '#030712' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
      });
    } else if (tool === 'rectangle' || tool === 'circle') {
      setCurrentElement({
        id: Math.random().toString(36).substring(7),
        type: tool,
        x,
        y,
        width: 0,
        height: 0,
        color,
        strokeWidth,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if ((tool === 'pencil' || tool === 'eraser') && currentElement.points) {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, { x, y }],
      });
    } else if (
      (tool === 'rectangle' || tool === 'circle') &&
      currentElement.x !== undefined &&
      currentElement.y !== undefined
    ) {
      setCurrentElement({
        ...currentElement,
        width: x - currentElement.x,
        height: y - currentElement.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);
    const updated = [...elements, currentElement];
    setElements(updated);
    setCurrentElement(null);
    if (onElementsChange) {
      onElementsChange(updated);
    }
  };

  const handleUndo = () => {
    if (elements.length === 0) return;
    const updated = elements.slice(0, -1);
    setElements(updated);
    if (onElementsChange) {
      onElementsChange(updated);
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleClear = () => {
    setElements([]);
    if (onElementsChange) onElementsChange([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 select-none">
      {/* Whiteboard Controls */}
      <div className="p-2 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-900/60">
        <div className="flex items-center gap-1">
          {(['pencil', 'rectangle', 'circle', 'text', 'eraser'] as WhiteboardTool[]).map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                tool === t
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Stroke width selector */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
          <span>Width:</span>
          {[2, 4, 8].map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`w-6 h-6 rounded flex items-center justify-center border text-xs transition-colors ${
                strokeWidth === w
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-bold'
                  : 'border-gray-800 hover:border-gray-700 text-gray-400'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Color Palette (disabled for eraser) */}
        <div className="flex items-center gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              disabled={tool === 'eraser'}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                color === c && tool !== 'eraser' ? 'scale-110 border-indigo-400' : 'border-transparent'
              } ${tool === 'eraser' ? 'opacity-30 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={elements.length === 0}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 rounded text-xs transition-colors"
          >
            Undo
          </button>
          <button
            onClick={handleClear}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleExportPNG}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs transition-colors shadow-sm"
          >
            Export PNG
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-gray-950 cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
