import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  theme: string;
  language: string;
  tabSize: number;
  lineWrapping: boolean;
}

interface SettingsState {
  settings: EditorSettings;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;
  appTheme: 'dark' | 'light';
  toggleAppTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        fontFamily: "'Fira Code', monospace",
        fontSize: 14,
        lineHeight: 1.5,
        theme: 'dracula',
        language: 'javascript',
        tabSize: 2,
        lineWrapping: true,
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      appTheme: 'dark',
      toggleAppTheme: () =>
        set((state) => ({
          appTheme: state.appTheme === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'devmesh-settings',
    },
  ),
);
