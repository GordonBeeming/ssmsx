import { create } from "zustand";

export interface QueryTab {
  id: string;
  connectionId: string;
  database: string;
  initialSql?: string;
  title: string;
}

interface QueryState {
  tabs: QueryTab[];
  activeTabId: string | null;

  addTab: (tab: QueryTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}

export const useQueryStore = create<QueryState>((set) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    })),

  removeTab: (id) =>
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id);
      return {
        tabs,
        activeTabId:
          state.activeTabId === id
            ? tabs.length > 0
              ? tabs[tabs.length - 1].id
              : null
            : state.activeTabId,
      };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),
}));
