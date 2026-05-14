export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: number | null;
  isActive: boolean;
}

export interface CategoryNode extends CategoryRow {
  children: CategoryNode[];
}

export function buildCategoryTree(rows: CategoryRow[], rootParentId?: number): CategoryNode[] {
  const nodeMap = new Map<number, CategoryNode>();
  for (const row of rows) {
    nodeMap.set(row.id, { ...row, children: [] });
  }

  const roots: CategoryNode[] = [];
  for (const row of rows) {
    const node = nodeMap.get(row.id)!;
    if (row.parentId != null && nodeMap.has(row.parentId)) {
      nodeMap.get(row.parentId)!.children.push(node);
    } else if (row.parentId == null) {
      roots.push(node);
    }
  }

  if (rootParentId !== undefined) {
    return nodeMap.has(rootParentId) ? [nodeMap.get(rootParentId)!] : [];
  }
  return roots;
}

export function applyDepthLimit(nodes: CategoryNode[], maxDepth: number, currentDepth = 1): CategoryNode[] {
  return nodes.map((node) => ({
    ...node,
    children: currentDepth >= maxDepth ? [] : applyDepthLimit(node.children, maxDepth, currentDepth + 1),
  }));
}
