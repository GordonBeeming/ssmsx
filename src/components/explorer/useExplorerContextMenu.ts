import { useCallback } from "react";
import type { ExplorerNode } from "../../stores/explorerStore";
import { useExplorerStore } from "../../stores/explorerStore";
import { useConnectionStore } from "../../stores/connectionStore";
import { useQueryStore } from "../../stores/queryStore";
import {
  explorerColumns,
  explorerObjectDefinition,
} from "../../commands/explorer";
import type { ContextMenuItem } from "../ui/ContextMenu";

/** Escape `]` as `]]` and wrap in brackets for safe SQL identifiers */
function quoteSqlName(name: string): string {
  return `[${name.replace(/\]/g, "]]")}]`;
}

export function useExplorerContextMenu() {
  const refreshNode = useExplorerStore((s) => s.refreshNode);
  const disconnect = useConnectionStore((s) => s.disconnect);
  const addTab = useQueryStore((s) => s.addTab);

  const getMenuItems = useCallback(
    (node: ExplorerNode): ContextMenuItem[] => {
      const items: ContextMenuItem[] = [];

      switch (node.type) {
        case "server":
          items.push({
            label: "Disconnect",
            onClick: () => disconnect(node.connectionId),
            danger: true,
          });
          items.push({ separator: true, label: "", onClick: () => {} });
          items.push({
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "database":
          items.push({
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "table":
          items.push({
            label: "Script as SELECT TOP 1000",
            onClick: async () => {
              const columns = await explorerColumns(
                node.connectionId,
                node.database!,
                node.schema!,
                node.name
              );
              const colsPerRow = 4;
              const colNames = columns.map((c) => quoteSqlName(c.name));
              const rows: string[] = [];
              for (let i = 0; i < colNames.length; i += colsPerRow) {
                rows.push("    " + colNames.slice(i, i + colsPerRow).join(", "));
              }
              const colList = rows.join(",\n");
              const sql = `SELECT TOP 1000\n${colList}\nFROM ${quoteSqlName(node.database!)}.${quoteSqlName(node.schema!)}.${quoteSqlName(node.name)}`;
              addTab({
                id: crypto.randomUUID(),
                connectionId: node.connectionId,
                database: node.database!,
                initialSql: sql,
                title: `SELECT ${node.schema}.${node.name}`,
              });
            },
          });
          items.push({
            label: "Script as CREATE",
            onClick: async () => {
              const result = await explorerObjectDefinition(
                node.connectionId,
                node.database!,
                node.schema!,
                node.name,
                "table"
              );
              addTab({
                id: crypto.randomUUID(),
                connectionId: node.connectionId,
                database: node.database!,
                initialSql: result.definition ?? "-- Could not generate script",
                title: `CREATE ${node.schema}.${node.name}`,
              });
            },
          });
          items.push({ separator: true, label: "", onClick: () => {} });
          items.push({
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "view":
          items.push({
            label: "Script as SELECT TOP 1000",
            onClick: async () => {
              const columns = await explorerColumns(
                node.connectionId,
                node.database!,
                node.schema!,
                node.name
              );
              const colsPerRow = 4;
              const colNames = columns.map((c) => quoteSqlName(c.name));
              const rows: string[] = [];
              for (let i = 0; i < colNames.length; i += colsPerRow) {
                rows.push("    " + colNames.slice(i, i + colsPerRow).join(", "));
              }
              const colList = rows.join(",\n");
              const sql = `SELECT TOP 1000\n${colList}\nFROM ${quoteSqlName(node.database!)}.${quoteSqlName(node.schema!)}.${quoteSqlName(node.name)}`;
              addTab({
                id: crypto.randomUUID(),
                connectionId: node.connectionId,
                database: node.database!,
                initialSql: sql,
                title: `SELECT ${node.schema}.${node.name}`,
              });
            },
          });
          items.push({
            label: "Script as CREATE",
            onClick: async () => {
              const result = await explorerObjectDefinition(
                node.connectionId,
                node.database!,
                node.schema!,
                node.name,
                "view"
              );
              addTab({
                id: crypto.randomUUID(),
                connectionId: node.connectionId,
                database: node.database!,
                initialSql: result.definition ?? "-- Could not generate script",
                title: `CREATE ${node.schema}.${node.name}`,
              });
            },
          });
          items.push({ separator: true, label: "", onClick: () => {} });
          items.push({
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "procedure":
          items.push({
            label: "Script as CREATE",
            onClick: async () => {
              const result = await explorerObjectDefinition(
                node.connectionId,
                node.database!,
                node.schema!,
                node.name,
                "procedure"
              );
              addTab({
                id: crypto.randomUUID(),
                connectionId: node.connectionId,
                database: node.database!,
                initialSql: result.definition ?? "-- Could not generate script",
                title: `CREATE ${node.schema}.${node.name}`,
              });
            },
          });
          break;

        case "function":
          items.push({
            label: "Script as CREATE",
            onClick: async () => {
              const result = await explorerObjectDefinition(
                node.connectionId,
                node.database!,
                node.schema!,
                node.name,
                "function"
              );
              addTab({
                id: crypto.randomUUID(),
                connectionId: node.connectionId,
                database: node.database!,
                initialSql: result.definition ?? "-- Could not generate script",
                title: `CREATE ${node.schema}.${node.name}`,
              });
            },
          });
          break;

        case "folder":
          items.push({
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        default:
          break;
      }

      return items;
    },
    [refreshNode, disconnect, addTab]
  );

  return getMenuItems;
}
