import { create } from 'zustand';

type Sel = { selected: string[]; set: (ids: string[]) => void; clear: () => void };
export const usePlanSelection = create<Sel>((set) => ({
  selected: [],
  set: (ids) => set({ selected: ids }),
  clear: () => set({ selected: [] }),
}));
