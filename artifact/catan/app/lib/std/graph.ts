export type GraphNeighbours<Node> = (node: Node) => Iterable<Node>;
export type GraphKeyOf<Node, Key> = (node: Node) => Key;

const identity = <Value>(value: Value): Value => value;

/**
 * Traverses every node reachable from `start` in depth-first order.
 *
 * Nodes are visited once according to `keyOf`. Neighbours are explored in the
 * order supplied by `neighbours`, making traversal deterministic when that
 * iterable is deterministic.
 */
function* dfs<Node, Key = Node>(
  start: Node,
  neighbours: GraphNeighbours<Node>,
  keyOf: GraphKeyOf<Node, Key> = identity as GraphKeyOf<Node, Key>,
): Generator<Node> {
  const seen = new Set<Key>();
  const stack = [start];

  while (stack.length > 0) {
    const node = stack.pop() as Node;
    const key = keyOf(node);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    yield node;

    const next = Array.from(neighbours(node));
    for (let i = next.length - 1; i >= 0; i--) {
      const neighbour = next[i];
      if (!seen.has(keyOf(neighbour))) {
        stack.push(neighbour);
      }
    }
  }
}

/** Collects the nodes reachable from `start` in deterministic DFS order. */
function reachable<Node, Key = Node>(
  start: Node,
  neighbours: GraphNeighbours<Node>,
  keyOf: GraphKeyOf<Node, Key> = identity as GraphKeyOf<Node, Key>,
): Node[] {
  return Array.from(dfs(start, neighbours, keyOf));
}

/** Returns each connected component within the supplied keyed nodes. */
function connectedComponents<Node, Key = Node>(
  nodes: Iterable<Node>,
  neighbours: GraphNeighbours<Node>,
  keyOf: GraphKeyOf<Node, Key> = identity as GraphKeyOf<Node, Key>,
): Node[][] {
  const nodesByKey = new Map<Key, Node>();
  for (const node of nodes) {
    nodesByKey.set(keyOf(node), node);
  }

  const remaining = new Set(nodesByKey.keys());
  const withinGraph = (node: Node): Node[] => {
    const result: Node[] = [];
    for (const neighbour of neighbours(node)) {
      const existing = nodesByKey.get(keyOf(neighbour));
      if (existing !== undefined) {
        result.push(existing);
      }
    }
    return result;
  };

  const components: Node[][] = [];
  while (remaining.size > 0) {
    const firstKey = remaining.values().next();
    if (firstKey.done) {
      break;
    }

    const first = nodesByKey.get(firstKey.value) as Node;
    const component = reachable(first, withinGraph, keyOf);
    for (const node of component) {
      remaining.delete(keyOf(node));
    }
    components.push(component);
  }

  return components;
}

/**
 * Returns whether the unique keyed nodes form one connected component.
 * Empty and single-node collections are connected.
 */
function isConnected<Node, Key = Node>(
  nodes: Iterable<Node>,
  neighbours: GraphNeighbours<Node>,
  keyOf: GraphKeyOf<Node, Key> = identity as GraphKeyOf<Node, Key>,
): boolean {
  return connectedComponents(nodes, neighbours, keyOf).length <= 1;
}

export const graph = {
  dfs,
  reachable,
  connectedComponents,
  isConnected,
} as const;
