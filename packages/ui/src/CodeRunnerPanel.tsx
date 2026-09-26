import React, { useState } from 'react';
import { CodeExecutionRequest, CodeExecutionResult } from '@devmesh/shared-types';

interface CodeRunnerPanelProps {
  currentCode: string;
  activeFilePath?: string;
  language?: string;
  onExecuteCode?: (req: CodeExecutionRequest) => Promise<CodeExecutionResult>;
}

const PlayIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

export const CodeRunnerPanel: React.FC<CodeRunnerPanelProps> = ({
  currentCode,
  activeFilePath = 'index.ts',
  language = 'javascript',
  onExecuteCode,
}) => {
  const [stdin, setStdin] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CodeExecutionResult | null>(null);
  const [showStdin, setShowStdin] = useState(false);

  const handleRun = async () => {
    if (!currentCode.trim()) return;
    setIsRunning(true);
    try {
      if (onExecuteCode) {
        const res = await onExecuteCode({
          code: currentCode,
          language,
          input: stdin || undefined,
        });
        setResult(res);
      } else {
        // Built-in browser-based JavaScript sandbox runner fallback
        const startTime = performance.now();
        const logs: string[] = [];
        const errors: string[] = [];

        const originalLog = console.log;
        const originalError = console.error;

        try {
          console.log = (...args) => {
            logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
          };
          console.error = (...args) => {
            errors.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
          };

          // Safe execution wrapper
          const fn = new Function('input', currentCode);
          const ret = fn(stdin);
          if (ret !== undefined && logs.length === 0) {
            logs.push(typeof ret === 'object' ? JSON.stringify(ret, null, 2) : String(ret));
          }
        } catch (err: any) {
          errors.push(err?.stack || err?.message || String(err));
        } finally {
          console.log = originalLog;
          console.error = originalError;
        }

        const elapsed = Math.round(performance.now() - startTime);
        setResult({
          stdout: logs.join('\n'),
          stderr: errors.join('\n'),
          exitCode: errors.length > 0 ? 1 : 0,
          executionTimeMs: elapsed,
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      setResult({
        stdout: '',
        stderr: err?.message || 'Execution error',
        exitCode: 1,
        executionTimeMs: 0,
        timestamp: Date.now(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setResult(null);
  };

  const handleCopyOutput = async () => {
    if (result) {
      const text = `${result.stdout}\n${result.stderr}`.trim();
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-gray-400">Code Runner</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-indigo-400">
            {language}
          </span>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || !currentCode.trim()}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          <PlayIcon />
          <span>{isRunning ? 'Running...' : 'Run Code'}</span>
        </button>
      </div>

      <div className="p-2 border-b border-gray-800 bg-gray-900/40 flex items-center justify-between text-xs">
        <button
          onClick={() => setShowStdin(!showStdin)}
          className="text-gray-400 hover:text-gray-200 text-[11px] font-mono flex items-center gap-1"
        >
          <span>{showStdin ? '▼' : '▶'}</span>
          <span>Standard Input (stdin)</span>
        </button>
        {result && (
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-gray-500">{result.executionTimeMs}ms</span>
            <span
              className={`px-1.5 py-0.2 rounded font-semibold ${
                result.exitCode === 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              Exit {result.exitCode}
            </span>
          </div>
        )}
      </div>

      {showStdin && (
        <div className="p-2 border-b border-gray-800 bg-gray-900/20">
          <textarea
            rows={2}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Custom standard input to pass to execution..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs font-mono text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
      )}

      {/* Output Console Viewport */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-950 p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-gray-400">Terminal Output</span>
          {result && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyOutput}
                className="p-1 hover:bg-gray-900 text-gray-400 hover:text-gray-200 rounded transition-colors text-xs"
                title="Copy Output"
              >
                <CopyIcon />
              </button>
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-900 text-gray-400 hover:text-red-400 rounded transition-colors text-xs"
                title="Clear Console"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl p-3 font-mono text-xs overflow-y-auto space-y-2">
          {!result ? (
            <div className="text-gray-600 italic text-center py-12">
              Press "Run Code" above to execute the active file.
            </div>
          ) : (
            <>
              {result.stdout && (
                <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
                  {result.stdout}
                </pre>
              )}
              {result.stderr && (
                <pre className="text-red-400 whitespace-pre-wrap leading-relaxed">
                  {result.stderr}
                </pre>
              )}
              {!result.stdout && !result.stderr && (
                <div className="text-gray-500 italic">Program finished with no output.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
