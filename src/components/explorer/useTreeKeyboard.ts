import { useCallback } from "react";
import type { ExplorerNode } from "../../stores/explorerStore";
import { useExplorerStore } from "../../stores/explorerStore";

export function useTreeKeyboard(
  visibleNodes: { node: ExplorerNode; depth: number }[]
) {
  const { selectedNodeId, selectNode, toggleExpand } = useExplorerStore();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = visibleNodes.findIndex(
        (v) => v.node.id === selectedNodeId
      );

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = Math.min(currentIndex + 1, visibleNodes.length - 1);
          if (next >= 0) selectNode(visibleNodes[next].node.id);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = Math.max(currentIndex - 1, 0);
          if (prev >= 0) selectNode(visibleNodes[prev].node.id);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (currentIndex < 0) break;
          const node = visibleNodes[currentIndex].node;
          if (!node.expanded && node.hasChildren) {
            toggleExpand(node.id);
          } else if (node.expanded && node.children.length > 0) {
            // Move to first child
            const nextIdx = currentIndex + 1;
            if (nextIdx < visibleNodes.length) {
              selectNode(visibleNodes[nextIdx].node.id);
            }
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (currentIndex < 0) break;
          const node = visibleNodes[currentIndex].node;
          if (node.expanded) {
            toggleExpand(node.id);
          } else if (node.parentId) {
            // Move to parent
            const parentIdx = visibleNodes.findIndex(
              (v) => v.node.id === node.parentId
            );
            if (parentIdx >= 0) selectNode(visibleNodes[parentIdx].node.id);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (currentIndex < 0) break;
          const node = visibleNodes[currentIndex].node;
          if (node.hasChildren) toggleExpand(node.id);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (visibleNodes.length > 0) selectNode(visibleNodes[0].node.id);
          break;
        }
        case "End": {
          e.preventDefault();
          if (visibleNodes.length > 0)
            selectNode(visibleNodes[visibleNodes.length - 1].node.id);
          break;
        }
      }
    },
    [visibleNodes, selectedNodeId, selectNode, toggleExpand]
  );

  return handleKeyDown;
}
