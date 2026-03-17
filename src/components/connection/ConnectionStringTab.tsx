import { useState } from "react";
import type { ConnectionInfo, AuthType, EncryptMode } from "../../commands/connection";
import { useConnectionStore } from "../../stores/connectionStore";

function parseConnectionString(cs: string): Partial<ConnectionInfo> {
  const parts: Record<string, string> = {};
  for (const segment of cs.split(";")) {
    const eqIdx = segment.indexOf("=");
    if (eqIdx > 0) {
      const key = segment.substring(0, eqIdx).trim().toLowerCase();
      const value = segment.substring(eqIdx + 1).trim();
      parts[key] = value;
    }
  }

  const serverName =
    parts["server"] || parts["data source"] || parts["addr"] || "";
  const database =
    parts["database"] || parts["initial catalog"] || "";
  const username = parts["user id"] || parts["uid"] || "";
  const encrypt = parts["encrypt"]?.toLowerCase();
  const trust =
    parts["trustservercertificate"]?.toLowerCase() === "true";

  let encryptMode: EncryptMode = "Mandatory";
  if (encrypt === "optional" || encrypt === "false") encryptMode = "Optional";
  else if (encrypt === "strict") encryptMode = "Strict";

  let authType: AuthType = "SqlAuth";
  if (username) authType = "SqlAuth";

  return {
    serverName,
    database: database || undefined,
    username: username || undefined,
    encrypt: encryptMode,
    trustServerCertificate: trust,
    authType,
  };
}

export function ConnectionStringTab() {
  const {
    selectedConnection,
    loading,
    selectConnection,
    setDialogTab,
    connect,
    saveConnection,
  } = useConnectionStore();

  const [cs, setCs] = useState(selectedConnection?.connectionString || "");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    if (!cs.trim()) return;
    const parsed = parseConnectionString(cs);
    if (!parsed.serverName) {
      setError("Could not find Server or Data Source in connection string");
      return;
    }
    setError(null);

    const info: ConnectionInfo = {
      id: selectedConnection?.id || crypto.randomUUID(),
      name: selectedConnection?.name || "",
      serverName: parsed.serverName,
      authType: parsed.authType || "SqlAuth",
      username: parsed.username,
      database: parsed.database,
      encrypt: parsed.encrypt || "Mandatory",
      trustServerCertificate: parsed.trustServerCertificate || false,
      connectionString: cs,
      createdAt: selectedConnection?.createdAt || new Date().toISOString(),
    };

    selectConnection(info);
    setDialogTab("properties");
  };

  const handleConnect = async () => {
    if (!cs.trim()) return;
    const info: ConnectionInfo = {
      id: selectedConnection?.id || crypto.randomUUID(),
      name: selectedConnection?.name || "",
      serverName: "connection-string",
      authType: "ConnectionString",
      encrypt: "Mandatory",
      trustServerCertificate: false,
      connectionString: cs,
      createdAt: selectedConnection?.createdAt || new Date().toISOString(),
    };
    await saveConnection(info);
    await connect(info.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Connection String
        </label>
        <textarea
          value={cs}
          onChange={(e) => {
            setCs(e.target.value);
            setError(null);
          }}
          placeholder="Server=localhost;Database=mydb;User Id=sa;Password=...;Encrypt=Optional;TrustServerCertificate=True;"
          rows={5}
          className="w-full resize-y rounded border border-bg-tertiary bg-bg-input px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-hover focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={handleParse}
          disabled={!cs.trim()}
          className="rounded border border-bg-tertiary bg-bg-secondary px-4 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Parse to Properties
        </button>
        <button
          onClick={handleConnect}
          disabled={loading || !cs.trim()}
          className="rounded bg-accent px-4 py-1.5 text-sm text-accent-text hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Connecting..." : "Connect"}
        </button>
      </div>
    </div>
  );
}
