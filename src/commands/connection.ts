import { invoke } from "@tauri-apps/api/core";

export type AuthType = "SqlAuth" | "ConnectionString" | "EntraMfa";
export type EncryptMode = "Mandatory" | "Optional" | "Strict";

export interface ConnectionInfo {
  id: string;
  name: string;
  serverName: string;
  authType: AuthType;
  username?: string;
  credentialRef?: string;
  database?: string;
  encrypt: EncryptMode;
  trustServerCertificate: boolean;
  connectionString?: string;
  color?: string;
  lastUsed?: string;
  createdAt: string;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
}

export interface ConnectionConnectResult {
  connectionId: string;
}

export interface ConnectionDeleteResult {
  deleted: boolean;
}

export async function connectionList(): Promise<ConnectionInfo[]> {
  const result = await invoke<string>("connection_list");
  return JSON.parse(result);
}

export async function connectionGet(id: string): Promise<ConnectionInfo | null> {
  const result = await invoke<string>("connection_get", { id });
  return JSON.parse(result);
}

export async function connectionSave(
  connection: ConnectionInfo,
  password?: string,
  clearCredential?: boolean
): Promise<ConnectionInfo> {
  const result = await invoke<string>("connection_save", { connection, password, clearCredential: clearCredential ?? false });
  return JSON.parse(result);
}

export async function connectionDelete(id: string): Promise<ConnectionDeleteResult> {
  const result = await invoke<string>("connection_delete", { id });
  return JSON.parse(result);
}

export async function connectionTest(
  connection: ConnectionInfo,
  password?: string
): Promise<ConnectionTestResult> {
  const result = await invoke<string>("connection_test", { connection, password });
  return JSON.parse(result);
}

export async function connectionConnect(id: string): Promise<ConnectionConnectResult> {
  const result = await invoke<string>("connection_connect", { id });
  return JSON.parse(result);
}

export async function connectionDisconnect(id: string): Promise<void> {
  await invoke<string>("connection_disconnect", { id });
}
