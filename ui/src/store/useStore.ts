import { create } from 'zustand';
import { DailyEntry } from '../types';

interface State {
  entries: DailyEntry[];
  currentEntry: DailyEntry | null;
  addEntry: (entry: DailyEntry) => void;
  setCurrentEntry: (entry: DailyEntry) => void;
  updateEntry: (entry: DailyEntry) => void;
}

export const useStore = create<State>((set) => ({
  entries: [],
  currentEntry: null,
  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
  setCurrentEntry: (entry) => set({ currentEntry: entry }),
  updateEntry: (updatedEntry) =>
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      ),
      currentEntry: state.currentEntry?.id === updatedEntry.id ? updatedEntry : state.currentEntry,
    })),
}));