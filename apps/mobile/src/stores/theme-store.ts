import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'auto',
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem('theme-mode', mode);
  },
  loadSavedTheme: async () => {
    const saved = await AsyncStorage.getItem('theme-mode');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      set({ mode: saved });
    }
  },
}));
