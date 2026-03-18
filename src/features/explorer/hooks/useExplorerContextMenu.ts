import { useCallback } from "react";
import type { ExplorerNode } from "../types";
import { useExplorerStore } from "../store/explorerStore";
import { useConnectionStore } from "../../connection";
import { useQueryStore } from "../../query";
import {
  explorerColumns,
  explorerObjectDefinition,
} from "../api/explorerApi";
import type { ContextMenuItem } from "../../../shared/components/ContextMenu";
import { quoteSqlName } from "../../../shared/utils/sql";

/**
 * Build a SELECT TOP 1000 script for a table or view.
 * Shared between the "table" and "view" context menu items.
 */
async function buildSelectTop1000Script(
  connectionId: string,
  database: string,
  schema: string,
  objectName: string
): Promise<string> {
  const columns = await explorerColumns(
    connectionId,
    database,
    schema,
    objectName
  );
  const colsPerRow = 4;
  const colNames = columns.map((c) => quoteSqlName(c.name));
  const rows: string[] = [];
  for (let i = 0; i < colNames.length; i += colsPerRow) {
    rows.push("    " + colNames.slice(i, i + colsPerRow).join(", "));
  }
  const colList = rows.join(",\n");
  return `SELECT TOP 1000\n${colList}\nFROM ${quoteSqlName(database)}.${quoteSqlName(schema)}.${quoteSqlName(objectName)}`;
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
            type: "action",
            label: "Disconnect",
            onClick: () => disconnect(node.connectionId),
            danger: true,
          });
          items.push({ type: "separator" });
          items.push({
            type: "action",
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "database":
          items.push({
            type: "action",
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "table":
          items.push({
            type: "action",
            label: "Script as SELECT TOP 1000",
            onClick: async () => {
              if (!node.database) {
                console.error(`Expected database on node ${node.id} but it was undefined`);
                return;
              }
              if (!node.schema) {
                console.error(`Expected schema on node ${node.id} but it was undefined`);
                return;
              }
              try {
                const sql = await buildSelectTop1000Script(
                  node.connectionId,
                  node.database,
                  node.schema,
                  node.name
                );
                addTab({
                  id: crypto.randomUUID(),
                  connectionId: node.connectionId,
                  database: node.database,
                  initialSql: sql,
                  title: `SELECT ${node.schema}.${node.name}`,
                });
              } catch (error) {
                console.error(`Failed to script SELECT for ${node.name}:`, error);
              }
            },
          });
          items.push({
            type: "action",
            label: "Script as CREATE",
            onClick: async () => {
              if (!node.database) {
                console.error(`Expected database on node ${node.id} but it was undefined`);
                return;
              }
              if (!node.schema) {
                console.error(`Expected schema on node ${node.id} but it was undefined`);
                return;
              }
              try {
                const result = await explorerObjectDefinition(
                  node.connectionId,
                  node.database,
                  node.schema,
                  node.name,
                  "table"
                );
                addTab({
                  id: crypto.randomUUID(),
                  connectionId: node.connectionId,
                  database: node.database,
                  initialSql: result.definition ?? "-- Could not generate script",
                  title: `CREATE ${node.schema}.${node.name}`,
                });
              } catch (error) {
                console.error(`Failed to script CREATE for ${node.name}:`, error);
              }
            },
          });
          items.push({ type: "separator" });
          items.push({
            type: "action",
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "view":
          items.push({
            type: "action",
            label: "Script as SELECT TOP 1000",
            onClick: async () => {
              if (!node.database) {
                console.error(`Expected database on node ${node.id} but it was undefined`);
                return;
              }
              if (!node.schema) {
                console.error(`Expected schema on node ${node.id} but it was undefined`);
                return;
              }
              try {
                const sql = await buildSelectTop1000Script(
                  node.connectionId,
                  node.database,
                  node.schema,
                  node.name
                );
                addTab({
                  id: crypto.randomUUID(),
                  connectionId: node.connectionId,
                  database: node.database,
                  initialSql: sql,
                  title: `SELECT ${node.schema}.${node.name}`,
                });
              } catch (error) {
                console.error(`Failed to script SELECT for ${node.name}:`, error);
              }
            },
          });
          items.push({
            type: "action",
            label: "Script as CREATE",
            onClick: async () => {
              if (!node.database) {
                console.error(`Expected database on node ${node.id} but it was undefined`);
                return;
              }
              if (!node.schema) {
                console.error(`Expected schema on node ${node.id} but it was undefined`);
                return;
              }
              try {
                const result = await explorerObjectDefinition(
                  node.connectionId,
                  node.database,
                  node.schema,
                  node.name,
                  "view"
                );
                addTab({
                  id: crypto.randomUUID(),
                  connectionId: node.connectionId,
                  database: node.database,
                  initialSql: result.definition ?? "-- Could not generate script",
                  title: `CREATE ${node.schema}.${node.name}`,
                });
              } catch (error) {
                console.error(`Failed to script CREATE for ${node.name}:`, error);
              }
            },
          });
          items.push({ type: "separator" });
          items.push({
            type: "action",
            label: "Refresh",
            onClick: () => refreshNode(node.id),
          });
          break;

        case "procedure":
          items.push({
            type: "action",
            label: "Script as CREATE",
            onClick: async () => {
              if (!node.database) {
                console.error(`Expected database on node ${node.id} but it was undefined`);
                return;
              }
              if (!node.schema) {
                console.error(`Expected schema on node ${node.id} but it was undefined`);
                return;
              }
              try {
                const result = await explorerObjectDefinition(
                  node.connectionId,
                  node.database,
                  node.schema,
                  node.name,
                  "procedure"
                );
                addTab({
                  id: crypto.randomUUID(),
                  connectionId: node.connectionId,
                  database: node.database,
                  initialSql: result.definition ?? "-- Could not generate script",
                  title: `CREATE ${node.schema}.${node.name}`,
                });
              } catch (error) {
                console.error(`Failed to script CREATE for ${node.name}:`, error);
              }
            },
          });
          break;

        case "function":
          items.push({
            type: "action",
            label: "Script as CREATE",
            onClick: async () => {
              if (!node.database) {
                console.error(`Expected database on node ${node.id} but it was undefined`);
                return;
              }
              if (!node.schema) {
                console.error(`Expected schema on node ${node.id} but it was undefined`);
                return;
              }
              try {
                const result = await explorerObjectDefinition(
                  node.connectionId,
                  node.database,
                  node.schema,
                  node.name,
                  "function"
                );
                addTab({
                  id: crypto.randomUUID(),
                  connectionId: node.connectionId,
                  database: node.database,
                  initialSql: result.definition ?? "-- Could not generate script",
                  title: `CREATE ${node.schema}.${node.name}`,
                });
              } catch (error) {
                console.error(`Failed to script CREATE for ${node.name}:`, error);
              }
            },
          });
          break;

        case "folder":
          items.push({
            type: "action",
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
