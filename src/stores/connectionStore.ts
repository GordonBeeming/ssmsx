import { create } from "zustand";
import type { ConnectionInfo, ConnectionTestResult } from "../commands/connection";
import {
  connectionList,
  connectionSave,
  connectionDelete,
  connectionTest,
  connectionConnect,
  connectionDisconnect,
} from "../commands/connection";

export type DialogTab = "properties" | "connectionString" | "custom";

interface ConnectionState {
  connections: ConnectionInfo[];
  selectedConnection: ConnectionInfo | null;
  activeConnectionId: string | null;
  dialogOpen: boolean;
  dialogTab: DialogTab;
  loading: boolean;
  testResult: ConnectionTestResult | null;
  error: string | null;
  searchFilter: string;

  loadConnections: () => Promise<void>;
  selectConnection: (c: ConnectionInfo | null) => void;
  openDialog: () => void;
  closeDialog: () => void;
  setDialogTab: (tab: DialogTab) => void;
  setSearchFilter: (filter: string) => void;
  saveConnection: (info: ConnectionInfo, password?: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  testConnection: (
    info: ConnectionInfo,
    password?: string
  ) => Promise<ConnectionTestResult>;
  connect: (id: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  selectedConnection: null,
  activeConnectionId: null,
  dialogOpen: false,
  dialogTab: "properties",
  loading: false,
  testResult: null,
  error: null,
  searchFilter: "",

  loadConnections: async () => {
    try {
      const connections = await connectionList();
      set({ connections, error: null });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  selectConnection: (c) => set({ selectedConnection: c, testResult: null }),

  openDialog: () => {
    set({
      dialogOpen: true,
      dialogTab: "properties",
      testResult: null,
      error: null,
    });
    get().loadConnections();
  },

  closeDialog: () =>
    set({
      dialogOpen: false,
      selectedConnection: null,
      testResult: null,
      error: null,
    }),

  setDialogTab: (tab) => set({ dialogTab: tab }),
  setSearchFilter: (filter) => set({ searchFilter: filter }),

  saveConnection: async (info, password) => {
    set({ loading: true, error: null });
    try {
      await connectionSave(info, password);
      await get().loadConnections();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  deleteConnection: async (id) => {
    set({ loading: true, error: null });
    try {
      await connectionDelete(id);
      const selected = get().selectedConnection;
      if (selected?.id === id) set({ selectedConnection: null });
      await get().loadConnections();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  testConnection: async (info, password) => {
    set({ loading: true, testResult: null, error: null });
    try {
      const result = await connectionTest(info, password);
      set({ testResult: result });
      return result;
    } catch (e) {
      const result = { success: false, error: String(e) };
      set({ testResult: result });
      return result;
    } finally {
      set({ loading: false });
    }
  },

  connect: async (id) => {
    set({ loading: true, error: null });
    try {
      await connectionConnect(id);
      set({ activeConnectionId: id, dialogOpen: false });
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  disconnect: async () => {
    const id = get().activeConnectionId;
    if (!id) return;
    try {
      await connectionDisconnect(id);
      set({ activeConnectionId: null });
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
