import type { SpelNodeImpl } from '../ast/spel-node.js';
import type { NodeType } from './node-type.js';

/**
 * Visitor interface for SpEL AST traversal.
 *
 * Usage pattern:
 * ```typescript
 * AstWalker.walk(ast, {
 *   enterNode(node, ancestors) {
 *     // Called before traversing children.
 *     // Return false to skip this node's subtree.
 *     return true;
 *   },
 *   leaveNode(node, ancestors) {
 *     // Called after all children have been traversed.
 *   },
 * });
 * ```
 *
 * The `ancestors` parameter provides the full path from the root node
 * to the current node's parent (current node NOT included).
 */
export interface AstVisitor {
  /**
   * Called when entering a node (pre-order).
   * @param node The current AST node
   * @param ancestors Path from root to parent (current node NOT included)
   * @returns `false` to skip traversing this node's children, otherwise continue
   */
  enterNode?: (node: SpelNodeImpl, ancestors: SpelNodeImpl[]) => boolean | undefined;

  /**
   * Called when leaving a node (post-order).
   * @param node The current AST node
   * @param ancestors Path from root to parent (current node NOT included)
   */
  leaveNode?: (node: SpelNodeImpl, ancestors: SpelNodeImpl[]) => void;
}

/**
 * AST Walker — utilities for traversing and querying SpEL ASTs.
 *
 * Designed to be the single traversal utility used by editors,
 * validators, formatters, and code generators.
 */
export namespace AstWalker {
  /**
   * Depth-first traversal of the AST.
   *
   * Calls `enterNode` before traversing children,
   * and `leaveNode` after all children have been visited.
   * If `enterNode` returns `false`, the subtree is skipped.
   *
   * @param root The AST root node
   * @param visitor Callback object
   */
  export function walk(root: SpelNodeImpl, visitor: AstVisitor): void {
    const ancestors: SpelNodeImpl[] = [];
    walkNode(root, ancestors, visitor);
  }

  /**
   * Collect all nodes matching a predicate.
   *
   * @param root The AST root node
   * @param predicate Filter function
   * @returns All matching nodes in depth-first order
   */
  export function collect(
    root: SpelNodeImpl,
    predicate: (node: SpelNodeImpl) => boolean,
  ): SpelNodeImpl[] {
    const result: SpelNodeImpl[] = [];
    walk(root, {
      enterNode(node) {
        if (predicate(node)) {
          result.push(node);
        }
        return true;
      },
    });
    return result;
  }

  /**
   * Find the node path from root to the node at a given character position.
   *
   * Returns the sequence of nodes from root to the deepest node
   * whose position range contains the given offset.
   *
   * @param root The AST root node
   * @param position Character offset in the source expression
   * @returns Array of nodes from root to target (inclusive), or empty if not found
   */
  export function findNodePath(root: SpelNodeImpl, position: number): SpelNodeImpl[] {
    const path: SpelNodeImpl[] = [];
    findPath(root, position, path);
    return path;
  }

  /**
   * Find the deepest node at a given character position.
   *
   * @param root The AST root node
   * @param position Character offset in the source expression
   * @returns The deepest node containing the position, or null
   */
  export function findNodeAt(root: SpelNodeImpl, position: number): SpelNodeImpl | null {
    const path = findNodePath(root, position);
    return path.length > 0 ? (path[path.length - 1] ?? null) : null;
  }

  /**
   * Collect all nodes of a specific NodeType.
   *
   * @param root The AST root node
   * @param nodeType The node type to filter by
   * @returns All matching nodes
   */
  export function collectOfType(root: SpelNodeImpl, nodeType: NodeType): SpelNodeImpl[] {
    return collect(root, (node) => node.nodeType === nodeType);
  }

  // ===== Private helpers =====

  function walkNode(node: SpelNodeImpl, ancestors: SpelNodeImpl[], visitor: AstVisitor): void {
    // Enter
    const shouldContinue = visitor.enterNode?.(node, ancestors);
    if (shouldContinue === false) return;

    // Push current node to ancestors for children
    ancestors.push(node);

    // Traverse children
    for (let i = 0; i < node.getChildCount(); i++) {
      walkNode(node.getChild(i), ancestors, visitor);
    }

    // Pop current node from ancestors
    ancestors.pop();

    // Leave
    visitor.leaveNode?.(node, ancestors);
  }

  function findPath(node: SpelNodeImpl, position: number, path: SpelNodeImpl[]): boolean {
    // Check if position falls within this node's span
    if (position < node.startPos || position > node.endPos) {
      return false;
    }

    path.push(node);

    // Try children — find the deepest match
    for (let i = 0; i < node.getChildCount(); i++) {
      if (findPath(node.getChild(i), position, path)) {
        return true; // Found in a child, path already contains child chain
      }
    }

    // No deeper match — current node is the deepest
    return true;
  }
}
