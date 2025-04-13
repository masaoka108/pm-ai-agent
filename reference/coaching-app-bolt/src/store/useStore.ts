import { create } from 'zustand';
import { DailyEntry, Message, MorningAnswers, EveningAnswers } from '../types';

interface State {
  currentEntry: DailyEntry | null;
  entries: DailyEntry[];
  setCurrentEntry: (entry: DailyEntry | null) => void;
  addEntry: (entry: DailyEntry) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMorningAnswers: (answers: MorningAnswers) => void;
  updateEveningAnswers: (answers: EveningAnswers) => void;
}

export const useStore = create<State>((set) => ({
  currentEntry: null,
  entries: [],
  setCurrentEntry: (entry) => set({ currentEntry: entry }),
  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
  addMessage: (message) =>
    set((state) => ({
      currentEntry: state.currentEntry
        ? {
            ...state.currentEntry,
            messages: [
              ...state.currentEntry.messages,
              {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                ...message,
              },
            ],
          }
        : null,
    })),
  updateMorningAnswers: (answers) =>
    set((state) => ({
      currentEntry: state.currentEntry
        ? { ...state.currentEntry, morningAnswers: answers }
        : null,
    })),
  updateEveningAnswers: (answers) =>
    set((state) => ({
      currentEntry: state.currentEntry
        ? { ...state.currentEntry, eveningAnswers: answers }
        : null,
    })),
}));