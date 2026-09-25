import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../src/store/workspaceStore';
import { exportProjectToZip, importProjectFromZip } from '../src/utils/zipUtils';

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().setAllFiles({
      'index.ts': 'console.log("hello");',
      'styles.css': 'body { margin: 0; }',
    });
  });

  it('should initialize with default files and active file', () => {
    const state = useWorkspaceStore.getState();
    expect(state.files).toContain('index.ts');
    expect(state.files).toContain('styles.css');
    expect(state.activeFile).toBe('index.ts');
    expect(state.openTabs).toContain('index.ts');
  });

  it('should create new file and set active tab', () => {
    const store = useWorkspaceStore.getState();
    store.createFile('utils.ts', 'export const add = (a, b) => a + b;');

    const state = useWorkspaceStore.getState();
    expect(state.files).toContain('utils.ts');
    expect(state.activeFile).toBe('utils.ts');
    expect(state.openTabs).toContain('utils.ts');
    expect(state.fileContents['utils.ts']).toContain('export const add');
  });

  it('should rename file and preserve tab / content mapping', () => {
    const store = useWorkspaceStore.getState();
    store.renameFile('index.ts', 'main.ts');

    const state = useWorkspaceStore.getState();
    expect(state.files).toContain('main.ts');
    expect(state.files).not.toContain('index.ts');
    expect(state.activeFile).toBe('main.ts');
    expect(state.openTabs).toContain('main.ts');
    expect(state.fileContents['main.ts']).toBe('console.log("hello");');
  });

  it('should delete file and switch active tab gracefully', () => {
    const store = useWorkspaceStore.getState();
    store.deleteFile('index.ts');

    const state = useWorkspaceStore.getState();
    expect(state.files).not.toContain('index.ts');
    expect(state.openTabs).not.toContain('index.ts');
    expect(state.activeFile).toBe('styles.css');
  });

  it('should open and close tabs correctly', () => {
    const store = useWorkspaceStore.getState();
    store.closeTab('index.ts');

    let state = useWorkspaceStore.getState();
    expect(state.openTabs).not.toContain('index.ts');

    store.openTab('index.ts');
    state = useWorkspaceStore.getState();
    expect(state.openTabs).toContain('index.ts');
    expect(state.activeFile).toBe('index.ts');
  });
});

describe('ZIP Utilities (zipUtils)', () => {
  it('should export project files to zip and re-import them with intact contents', async () => {
    const sourceFiles = {
      'src/index.ts': 'export const PI = 3.14159;',
      'src/components/App.tsx': 'export const App = () => <h1>Hello</h1>;',
      'package.json': '{"name": "test-app"}',
    };

    const zipBlob = await exportProjectToZip(sourceFiles, 'test-project');
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);

    const importedFiles = await importProjectFromZip(zipBlob);
    expect(Object.keys(importedFiles)).toHaveLength(3);
    expect(importedFiles['src/index.ts']).toBe(sourceFiles['src/index.ts']);
    expect(importedFiles['src/components/App.tsx']).toBe(sourceFiles['src/components/App.tsx']);
    expect(importedFiles['package.json']).toBe(sourceFiles['package.json']);
  });
});
