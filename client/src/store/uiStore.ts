// store/uiStore.ts
import { create } from "zustand";

type UIState = {
  isSidebarOpen: boolean;
  activeModal: string | null;

  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  openModal: (modal: string) => void;
  closeModal: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  activeModal: null,

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));