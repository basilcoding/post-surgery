import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarView: 'new',
  setSidebarView: (view) => set({ sidebarView: view }),
}));
