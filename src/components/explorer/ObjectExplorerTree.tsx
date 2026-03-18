import { useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useExplorerStore } from "../../stores/explorerStore";
import type { ExplorerNode } from "../../stores/explorerStore";
import { TreeNode } from "./TreeNode";
import { useTreeKeyboard } from "./useTreeKeyboard";
import { useExplorerContextMenu } from "./useExplorerContextMenu";
import { ContextMenu } from "../ui/ContextMenu";

export function ObjectExplorerTree() {
  // Subscribe to nodes/rootNodeIds so component re-renders when tree state changes
  const _nodes = useExplorerStore((s) => s.nodes);
  const _rootNodeIds = useExplorerStore((s) => s.rootNodeIds);
  void _nodes; void _rootNodeIds;
  const visibleNodes = useExplorerStore((s) => s.getVisibleNodes());
  const parentRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useTreeKeyboard(visibleNodes);
  const getMenuItems = useExplorerContextMenu();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: ExplorerNode;
  } | null>(null);

  const virtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 26,
    overscan: 10,
  });

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: ExplorerNode) => {
      e.preventDefault();
      const items = getMenuItems(node);
      if (items.length > 0) {
        setContextMenu({ x: e.clientX, y: e.clientY, node });
      }
    },
    [getMenuItems]
  );

  return (
    <div
      className="flex h-full flex-col border-r border-bg-tertiary"
      style={{ width: 260 }}
    >
      <div className="border-b border-bg-tertiary px-3 py-1.5">
        <span className="text-xs font-semibold tracking-wide text-text-secondary">
          OBJECT EXPLORER
        </span>
      </div>

      <div
        ref={parentRef}
        className="flex-1 overflow-auto focus:outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="tree"
      >
        {visibleNodes.length === 0 ? (
          <div className="p-3 text-xs text-text-secondary">
            No connections. Connect to a server to browse objects.
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const { node, depth } = visibleNodes[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <TreeNode
                    node={node}
                    depth={depth}
                    onContextMenu={handleContextMenu}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems(contextMenu.node)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
