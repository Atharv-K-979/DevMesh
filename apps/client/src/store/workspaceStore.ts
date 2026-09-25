import { create } from 'zustand';

export interface WorkspaceState {
  files: string[];
  fileContents: Record<string, string>;
  activeFile: string;
  openTabs: string[];
  createFile: (path: string, initialContent?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  updateFileContent: (path: string, content: string) => void;
  setActiveFile: (path: string) => void;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setAllFiles: (files: Record<string, string>, active?: string) => void;
}

const DEFAULT_MAIN_JS = `// Welcome to DevMesh Realtime Collaborative Editor!
// Code collaboratively with multi-file support, audio/video calls, and AI pair programming.

function greet(name) {
  console.log(\`Hello, \${name}! Let's build together with DevMesh.\`);
}

greet('Developer');
`;

const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DevMesh Project</title>
</head>
<body>
  <div id="root"></div>
  <script src="main.js"></script>
</body>
</html>
`;

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  files: ['main.js', 'index.html'],
  fileContents: {
    'main.js': DEFAULT_MAIN_JS,
    'index.html': DEFAULT_INDEX_HTML,
  },
  activeFile: 'main.js',
  openTabs: ['main.js', 'index.html'],

  createFile: (path: string, initialContent: string = '') => {
    const trimmed = path.trim();
    if (!trimmed) return;
    const { files, fileContents, openTabs } = get();
    if (files.includes(trimmed)) return;

    set({
      files: [...files, trimmed],
      fileContents: { ...fileContents, [trimmed]: initialContent },
      activeFile: trimmed,
      openTabs: openTabs.includes(trimmed) ? openTabs : [...openTabs, trimmed],
    });
  },

  deleteFile: (path: string) => {
    const { files, fileContents, activeFile, openTabs } = get();
    const remainingFiles = files.filter((f) => f !== path);
    const newContents = { ...fileContents };
    delete newContents[path];

    const remainingTabs = openTabs.filter((t) => t !== path);
    const newActive =
      activeFile === path
        ? remainingTabs[0] || remainingFiles[0] || ''
        : activeFile;

    set({
      files: remainingFiles,
      fileContents: newContents,
      openTabs: remainingTabs,
      activeFile: newActive,
    });
  },

  renameFile: (oldPath: string, newPath: string) => {
    const trimmedNew = newPath.trim();
    if (!trimmedNew || oldPath === trimmedNew) return;
    const { files, fileContents, activeFile, openTabs } = get();

    const updatedFiles = files.map((f) => (f === oldPath ? trimmedNew : f));
    const content = fileContents[oldPath] || '';
    const newContents = { ...fileContents, [trimmedNew]: content };
    delete newContents[oldPath];

    const updatedTabs = openTabs.map((t) => (t === oldPath ? trimmedNew : t));
    const newActive = activeFile === oldPath ? trimmedNew : activeFile;

    set({
      files: updatedFiles,
      fileContents: newContents,
      openTabs: updatedTabs,
      activeFile: newActive,
    });
  },

  updateFileContent: (path: string, content: string) => {
    const { fileContents } = get();
    set({
      fileContents: { ...fileContents, [path]: content },
    });
  },

  setActiveFile: (path: string) => {
    const { openTabs } = get();
    set({
      activeFile: path,
      openTabs: openTabs.includes(path) ? openTabs : [...openTabs, path],
    });
  },

  openTab: (path: string) => {
    const { openTabs } = get();
    if (!openTabs.includes(path)) {
      set({ openTabs: [...openTabs, path], activeFile: path });
    } else {
      set({ activeFile: path });
    }
  },

  closeTab: (path: string) => {
    const { openTabs, activeFile } = get();
    const remainingTabs = openTabs.filter((t) => t !== path);
    const newActive =
      activeFile === path ? remainingTabs[remainingTabs.length - 1] || '' : activeFile;
    set({
      openTabs: remainingTabs,
      activeFile: newActive,
    });
  },

  setAllFiles: (files: Record<string, string>, active?: string) => {
    const fileList = Object.keys(files);
    const targetActive = active && fileList.includes(active) ? active : fileList[0] || '';
    set({
      files: fileList,
      fileContents: files,
      activeFile: targetActive,
      openTabs: fileList.slice(0, 5),
    });
  },
}));
