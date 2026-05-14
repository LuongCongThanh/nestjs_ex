import { buildCategoryTree, applyDepthLimit, CategoryRow } from './category-tree.util';

const row = (id: number, parentId: number | null): CategoryRow => ({
  id,
  name: `Cat ${id}`,
  slug: `cat-${id}`,
  description: null,
  image: null,
  parentId,
  isActive: true,
});

describe('buildCategoryTree', () => {
  it('returns root nodes when no parentId filter', () => {
    const rows = [row(1, null), row(2, null), row(3, 1)];
    const tree = buildCategoryTree(rows);
    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe(1);
    expect(tree[1].id).toBe(2);
  });

  it('nests children under their parent', () => {
    const rows = [row(1, null), row(2, 1), row(3, 1), row(4, 2)];
    const tree = buildCategoryTree(rows);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].children[0].id).toBe(4);
  });

  it('returns subtree for a given rootParentId', () => {
    const rows = [row(1, null), row(2, 1), row(3, 1)];
    const tree = buildCategoryTree(rows, 1);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(1);
    expect(tree[0].children).toHaveLength(2);
  });

  it('returns empty array when rootParentId does not exist', () => {
    expect(buildCategoryTree([row(1, null)], 999)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(buildCategoryTree([])).toEqual([]);
  });

  it('does not mutate the input rows', () => {
    const rows = [row(1, null), row(2, 1)];
    const original = JSON.stringify(rows);
    buildCategoryTree(rows);
    expect(JSON.stringify(rows)).toBe(original);
  });
});

describe('applyDepthLimit', () => {
  it('removes children at the depth limit', () => {
    const rows = [row(1, null), row(2, 1), row(3, 2)];
    const tree = buildCategoryTree(rows);
    const limited = applyDepthLimit(tree, 1);
    expect(limited[0].children).toHaveLength(0);
  });

  it('preserves children within depth', () => {
    const rows = [row(1, null), row(2, 1), row(3, 2)];
    const tree = buildCategoryTree(rows);
    const limited = applyDepthLimit(tree, 2);
    expect(limited[0].children).toHaveLength(1);
    expect(limited[0].children[0].children).toHaveLength(0);
  });

  it('does not mutate the input tree', () => {
    const rows = [row(1, null), row(2, 1)];
    const tree = buildCategoryTree(rows);
    const original = JSON.stringify(tree);
    applyDepthLimit(tree, 1);
    expect(JSON.stringify(tree)).toBe(original);
  });
});
