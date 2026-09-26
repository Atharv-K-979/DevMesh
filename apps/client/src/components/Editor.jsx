import React, { useEffect, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import * as themes from '@uiw/codemirror-themes-all';
import { indentUnit } from '@codemirror/language';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { yCollab } from 'y-codemirror.next';

const detectLanguage = (filePath, fallbackLang) => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'cpp':
    case 'cc':
    case 'c':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'java':
      return 'java';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'sql':
      return 'sql';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    default:
      if (fallbackLang === 'clike') return 'cpp';
      if (fallbackLang === 'htmlmixed') return 'html';
      return fallbackLang || 'javascript';
  }
};

const USER_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#ef4444', '#06b6d4', '#84cc16'
];

const getRandomColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

export const Editor = forwardRef(
  ({ doc, provider, activeFilePath, username, language, theme, fontSize = 14, fontFamily = 'monospace', tabSize = 2, lineWrapping = true, onCodeChange }, ref) => {
    const [crdtExtension, setCrdtExtension] = useState(null);

    useEffect(() => {
      if (!provider || !provider.awareness) return;

      const userColor = getRandomColor(username || 'Guest');
      provider.awareness.setLocalStateField('user', {
        name: username || 'Guest',
        color: userColor,
        colorLight: userColor + '33',
      });

      const yText = doc.getText(`file:${activeFilePath}`);
      const collab = yCollab(yText, provider.awareness);
      setCrdtExtension(collab);

      const observer = () => {
        if (onCodeChange) {
          onCodeChange(yText.toString());
        }
      };

      yText.observe(observer);

      return () => {
        yText.unobserve(observer);
      };
    }, [doc, provider, activeFilePath, username, onCodeChange]);

    useImperativeHandle(ref, () => ({
      setCode: (newCode) => {
        const yText = doc.getText(`file:${activeFilePath}`);
        doc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, newCode);
        });
      },
    }));

    const targetLangName = detectLanguage(activeFilePath, language);
    const langExt = loadLanguage(targetLangName);

    const fontTheme = useMemo(() => {
      return EditorView.theme({
        '&': {
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily || 'monospace',
        },
        '.cm-content': {
          fontFamily: fontFamily || 'monospace',
          fontSize: `${fontSize}px`,
        },
        '.cm-gutters': {
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily || 'monospace',
        },
        '.cm-line': {
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily || 'monospace',
        },
      });
    }, [fontSize, fontFamily]);

    const extensions = useMemo(() => {
      const exts = [fontTheme];
      exts.push(indentUnit.of(' '.repeat(tabSize)));
      if (lineWrapping) exts.push(EditorView.lineWrapping);
      if (langExt) exts.push(langExt);
      if (crdtExtension) exts.push(crdtExtension);
      return exts;
    }, [langExt, crdtExtension, fontTheme, tabSize, lineWrapping]);

    const selectedTheme = themes[theme] || themes.dracula;

    return (
      <div
        className="h-full w-full overflow-hidden"
        style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily || 'monospace' }}
      >
        <CodeMirror
          height="100%"
          theme={selectedTheme}
          extensions={extensions}
          className="h-full"
        />
      </div>
    );
  },
);

Editor.displayName = 'Editor';

export default Editor;
