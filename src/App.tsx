import { useConnectionStore } from "./stores/connectionStore";
import { ConnectionDialog } from "./components/connection/ConnectionDialog";

function App() {
  const { activeConnectionId, connections, openDialog, disconnect } =
    useConnectionStore();

  const activeConnection = connections.find(
    (c) => c.id === activeConnectionId
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-bg-tertiary bg-bg-secondary px-4 py-2">
        <h1 className="text-sm font-bold tracking-wide">SSMSX</h1>
        <div className="flex-1" />

        {activeConnection ? (
          <div className="flex items-center gap-2">
            {activeConnection.color && (
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: activeConnection.color }}
              />
            )}
            <span className="text-sm text-text-primary">
              {activeConnection.name || activeConnection.serverName}
              {activeConnection.database
                ? ` / ${activeConnection.database}`
                : ""}
            </span>
            <button
              onClick={() => disconnect()}
              className="rounded border border-bg-tertiary bg-bg-primary px-2 py-0.5 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <span className="text-xs text-text-secondary">Not connected</span>
        )}

        <button
          onClick={openDialog}
          className="rounded bg-accent px-3 py-1 text-sm text-accent-text hover:bg-accent-hover"
        >
          {activeConnection ? "Change Connection" : "Connect"}
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 items-center justify-center">
        {!activeConnection && (
          <div className="text-center">
            <p className="text-lg text-text-secondary">
              Connect to a SQL Server to get started
            </p>
            <button
              onClick={openDialog}
              className="mt-4 rounded bg-accent px-6 py-2 text-accent-text hover:bg-accent-hover"
            >
              New Connection
            </button>
          </div>
        )}
      </div>

      <ConnectionDialog />
    </div>
  );
}

export default App;
