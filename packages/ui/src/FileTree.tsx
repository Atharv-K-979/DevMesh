import React, { useState } from 'react';

interface FileTreeProps {
  files: string[];
  activeFile: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onCreateFolder?: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  onExportZip: () => void;
  onImportZip: (file: File) => void;
  onUploadClick?: () => void;
}

const UploadIcon = () => (
  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return { color: 'text-amber-400', tag: 'Js' };
    case 'ts':
    case 'tsx':
      return { color: 'text-blue-400', tag: 'Ts' };
    case 'py':
      return { color: 'text-yellow-400', tag: 'Py' };
    case 'html':
      return { color: 'text-orange-400', tag: 'Html' };
    case 'css':
      return { color: 'text-sky-400', tag: 'Css' };
    case 'json':
      return { color: 'text-green-400', tag: 'Json' };
    case 'md':
      return { color: 'text-purple-400', tag: 'Md' };
    default:
      return { color: 'text-gray-400', tag: 'Txt' };
  }
};

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onExportZip,
  onImportZip,
  onUploadClick,
}) => {
  const [itemName, setItemName] = useState('');
  const [createType, setCreateType] = useState<'file' | 'folder' | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [renamedName, setRenamedName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    const cleanName = itemName.trim().replace(/^\/+|\/+$/g, '');
    if (createType === 'folder' && onCreateFolder) {
      onCreateFolder(cleanName);
    } else {
      onCreateFile(cleanName);
    }
    setItemName('');
    setCreateType(null);
  };

  const handleStartRename = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFile(filePath);
    setRenamedName(filePath);
  };

  const handleSaveRename = (oldPath: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!renamedName.trim() || renamedName.trim() === oldPath) {
      setEditingFile(null);
      return;
    }
    const cleanNewName = renamedName.trim().replace(/^\/+|\/+$/g, '');
    if (onRenameFile) {
      onRenameFile(oldPath, cleanNewName);
    }
    setEditingFile(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZip(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden bg-gray-950 border-r border-gray-800 text-gray-200 select-none">
      {/* Explorer Header */}
      <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-wider text-gray-400">Explorer</span>
          <span className="text-[10px] font-mono text-gray-500">({files.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="p-1 hover:bg-gray-800 text-gray-400 hover:text-indigo-400 rounded transition-colors text-xs font-semibold"
              title="Upload File"
            >
              <UploadIcon />
            </button>
          )}
          {onCreateFolder && (
            <button
              onClick={() => setCreateType(createType === 'folder' ? null : 'folder')}
              className={`p-1 hover:bg-gray-800 rounded transition-colors text-xs font-semibold ${
                createType === 'folder' ? 'text-indigo-400 bg-gray-800' : 'text-gray-400 hover:text-indigo-400'
              }`}
              title="New Folder"
            >
              <FolderIcon />
            </button>
          )}
          <button
            onClick={() => setCreateType(createType === 'file' ? null : 'file')}
            className={`p-1 hover:bg-gray-800 rounded transition-colors text-xs font-semibold ${
              createType === 'file' ? 'text-indigo-400 bg-gray-800' : 'text-gray-400 hover:text-indigo-400'
            }`}
            title="New File"
          >
            <span className="text-sm leading-none">+</span>
          </button>
        </div>
      </div>

      {/* New Item Creation Form */}
      {createType && (
        <form onSubmit={handleCreate} className="p-2.5 bg-gray-900/90 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>Creating new {createType}:</span>
            <button
              type="button"
              onClick={() => setCreateType(null)}
              className="text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={createType === 'folder' ? 'e.g. src/utils' : 'e.g. index.ts or components/App.tsx'}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="flex-1 bg-gray-950 text-xs px-2.5 py-1.5 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500 font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* File Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 italic border border-dashed border-gray-800 rounded-xl my-4">
            No files in workspace. Click <span className="text-indigo-400 font-bold">+</span> to create one.
          </div>
        ) : (
          files.map((filePath) => {
            const isActive = activeFile === filePath;
            const meta = getFileIcon(filePath);
            const isEditing = editingFile === filePath;

            if (isEditing) {
              return (
                <form
                  key={filePath}
                  onSubmit={(e) => handleSaveRename(filePath, e)}
                  className="p-1.5 bg-gray-900 rounded-lg border border-indigo-500 flex items-center gap-1"
                >
                  <input
                    type="text"
                    value={renamedName}
                    onChange={(e) => setRenamedName(e.target.value)}
                    className="flex-1 bg-gray-950 text-xs px-2 py-1 rounded text-white font-mono border border-gray-700 focus:outline-none"
                    autoFocus
                    onBlur={(e) => handleSaveRename(filePath, e)}
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 text-[10px] bg-indigo-600 text-white rounded font-semibold"
                  >
                    Save
                  </button>
                </form>
              );
            }

            return (
              <div
                key={filePath}
                onClick={() => onSelectFile(filePath)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 font-semibold shadow-sm'
                    : 'bg-gray-900/40 border-transparent hover:bg-gray-900 hover:border-gray-800 text-gray-300'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r" />}

                <div className="flex items-center gap-2 truncate pl-1">
                  <span className="truncate font-mono text-xs">{filePath}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 ${meta.color}`}>
                    {meta.tag}
                  </span>

                  {onRenameFile && (
                    <button
                      onClick={(e) => handleStartRename(filePath, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-800 hover:text-indigo-300 text-gray-500 rounded transition-all"
                      title="Rename File"
                    >
                      <EditIcon />
                    </button>
                  )}

                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(filePath);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 text-gray-500 rounded transition-all"
                      title="Delete File"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Export / Import Zip Action Row */}
      <div className="p-2 bg-gray-950 border-t border-gray-800 flex items-center justify-between gap-2">
        <button
          onClick={onExportZip}
          className="flex-1 py-1.5 px-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-gray-100 rounded-lg text-xs font-semibold transition-colors border border-gray-800 text-center"
          title="Export Project Zip"
        >
          Export ZIP
        </button>
        <label
          className="flex-1 py-1.5 px-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-gray-100 rounded-lg text-xs font-semibold transition-colors border border-gray-800 cursor-pointer text-center"
          title="Import Project Zip"
        >
          Import ZIP
          <input type="file" accept=".zip" onChange={handleImport} className="hidden" />
        </label>
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 bg-gray-900/80 border-t border-gray-800 text-[10px] text-gray-400 flex items-center justify-between font-mono tracking-tight">
        <span>DevMesh Workspace</span>
        <span className="text-emerald-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Synchronized
        </span>
      </div>
    </div>
  );
};
