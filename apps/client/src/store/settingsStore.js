import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
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
