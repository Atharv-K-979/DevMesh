import React, { useState } from 'react';
import { AiAction, AiCompletionRequest, AiCompletionResponse } from '@devmesh/shared-types';

interface AiAssistantPanelProps {
  onRunAiAction: (req: AiCompletionRequest) => Promise<AiCompletionResponse>;
  currentCodeContext?: string;
  onInsertCode?: (codeSnippet: string) => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  onRunAiAction,
  currentCodeContext = '',
  onInsertCode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [action, setAction] = useState<AiAction>('explain');
  const [provider, setProvider] = useState<'anthropic' | 'openai'>('anthropic');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!prompt.trim() && !currentCodeContext) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onRunAiAction({
        prompt: prompt.trim() || `Please ${action} the following code snippet:`,
        action,
        provider,
        contextCode: currentCodeContext,
      });
      setResponse(res.result);
    } catch (err: any) {
      setError(err?.message || 'AI generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-gray-400">AI Pair Programmer</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
          {provider === 'anthropic' ? 'Claude' : 'GPT-4o'}
        </span>
      </div>

      <div className="p-3 space-y-3 border-b border-gray-800">
        {/* Action selector */}
        <div className="grid grid-cols-4 gap-1">
          {(['explain', 'generate', 'refactor', 'fix'] as AiAction[]).map((act) => (
            <button
              key={act}
              onClick={() => setAction(act)}
              className={`py-1 rounded text-xs capitalize transition-colors font-medium ${
                action === act
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        {/* Provider selector */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setProvider('anthropic')}
            className={`flex-1 py-1 rounded border text-[11px] font-mono transition-colors ${
              provider === 'anthropic'
                ? 'bg-purple-950/40 border-purple-600 text-purple-300 font-bold'
                : 'bg-gray-900 border-gray-800 text-gray-500'
            }`}
          >
            Anthropic Claude
          </button>
          <button
            onClick={() => setProvider('openai')}
            className={`flex-1 py-1 rounded border text-[11px] font-mono transition-colors ${
              provider === 'openai'
                ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300 font-bold'
                : 'bg-gray-900 border-gray-800 text-gray-500'
            }`}
          >
            OpenAI GPT
          </button>
        </div>

        {/* Prompt Input */}
        <div className="space-y-1.5">
          <textarea
            rows={3}
            placeholder={
              action === 'explain'
                ? 'What do you want to understand about the selected code?'
                : action === 'generate'
                ? 'Describe what code to generate...'
                : `Instructions for ${action}...`
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Generating response...</span>
          ) : (
            <span>Run {action.toUpperCase()}</span>
          )}
        </button>
      </div>

      {/* Response Area */}
      <div className="flex-1 p-3 overflow-y-auto">
        {error && (
          <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg mb-3">
            {error}
          </div>
        )}

        {response ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Result:</span>
              {onInsertCode && (
                <button
                  onClick={() => onInsertCode(response)}
                  className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold transition-colors"
                >
                  Insert Into Editor
                </button>
              )}
            </div>
            <pre className="p-3 bg-gray-900 rounded-xl border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {response}
            </pre>
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 italic py-10">
            Select code in the editor or enter a prompt above to pair program.
          </div>
        )}
      </div>
    </div>
  );
};
