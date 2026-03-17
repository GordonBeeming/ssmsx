import { useState, useCallback } from "react";
import type { ConnectionInfo } from "../../commands/connection";
import { useConnectionStore } from "../../stores/connectionStore";
import { ContextMenu, type ContextMenuItem } from "../ui/ContextMenu";

const AUTH_TYPE_LABELS: Record<string, string> = {
  SqlAuth: "SQL",
  ConnectionString: "CS",
  EntraMfa: "Entra",
};

export function ConnectionList() {
  const {
    connections,
    searchFilter,
    setSearchFilter,
    selectConnection,
    connect,
    deleteConnection,
    setDialogTab,
  } = useConnectionStore();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    connection: ConnectionInfo;
  } | null>(null);

  const filtered = connections.filter((c) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.serverName.toLowerCase().includes(q) ||
      c.database?.toLowerCase().includes(q)
    );
  });

  const handleClick = useCallback(
    (c: ConnectionInfo) => {
      selectConnection(c);
      setDialogTab("properties");
    },
    [selectConnection, setDialogTab]
  );

  const handleDoubleClick = useCallback(
    (c: ConnectionInfo) => {
      connect(c.id);
    },
    [connect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, c: ConnectionInfo) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, connection: c });
    },
    []
  );

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          label: "Connect",
          onClick: () => connect(contextMenu.connection.id),
        },
        {
          label: "Edit",
          onClick: () => {
            selectConnection(contextMenu.connection);
            setDialogTab("properties");
          },
        },
        {
          label: "Delete",
          danger: true,
          onClick: () => deleteConnection(contextMenu.connection.id),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Search connections..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        className="w-full rounded border border-bg-tertiary bg-bg-input px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-hover focus:outline-none"
      />

      <div className="max-h-[300px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-secondary">
            {connections.length === 0
              ? "No saved connections"
              : "No connections match your search"}
          </p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-bg-tertiary"
              onClick={() => handleClick(c)}
              onDoubleClick={() => handleDoubleClick(c)}
              onContextMenu={(e) => handleContextMenu(e, c)}
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: c.color || "#555" }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">
                  {c.name || c.serverName}
                </div>
                <div className="truncate text-xs text-text-secondary">
                  {c.serverName}
                  {c.database ? ` / ${c.database}` : ""}
                  {c.username ? ` — ${c.username}` : ""}
                </div>
              </div>
              <span className="shrink-0 rounded bg-bg-tertiary px-1.5 py-0.5 text-xs text-text-secondary">
                {AUTH_TYPE_LABELS[c.authType] || c.authType}
              </span>
            </div>
          ))
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
