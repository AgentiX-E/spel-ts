import { AstWalker } from './ast-walker.js';
import { NodeType } from './node-type.js';
import type { SpelNodeImpl } from '../ast/spel-node.js';
import { SpelExpressionParser } from '../spel-expression-parser.js';
import { VariableReference } from '../ast/reference/variable-reference.js';
import { PropertyOrFieldReference } from '../ast/reference/property-or-field-reference.js';
import { BeanReference } from '../ast/reference/bean-reference.js';
import { TypeReference } from '../ast/reference/type-reference.js';

export enum SpelReferenceKind {
  VARIABLE = 'variable',
  ROOT_PROPERTY = 'root_property',
  THIS_PROPERTY = 'this_property',
  BEAN = 'bean',
  BEAN_FACTORY = 'bean_factory',
  TYPE = 'type',
  FUNCTION = 'function',
}

export interface SpelReference {
  kind: SpelReferenceKind;
  name: string;
  path: string[];
  startPos: number;
  endPos: number;
  nodeType: NodeType;
}

export class SpelReferenceExtractor {
  static extract(expression: string): SpelReference[] {
    try {
      const parser = new SpelExpressionParser();
      const ast = parser.parseRaw(expression);
      return SpelReferenceExtractor.extractFromAst(ast);
    } catch {
      return SpelReferenceExtractor.#extractFallback(expression);
    }
  }

  static extractFromAst(root: SpelNodeImpl): SpelReference[] {
    const refs: SpelReference[] = [];
    AstWalker.walk(root, {
      enterNode(node, ancestors) {
        switch (node.nodeType) {
          case NodeType.VARIABLE_REFERENCE: {
            const varRef = node as unknown as VariableReference;
            const name = typeof varRef.getVariableName === 'function' ? varRef.getVariableName() : '';
            const isFunction = ancestors.length > 0 &&
              ancestors[ancestors.length - 1]!.nodeType === NodeType.METHOD_REFERENCE;
            refs.push({
              kind: isFunction ? SpelReferenceKind.FUNCTION : SpelReferenceKind.VARIABLE,
              name, path: [name],
              startPos: node.startPos, endPos: node.endPos,
              nodeType: node.nodeType,
            });
            break;
          }
          case NodeType.PROPERTY_OR_FIELD_REFERENCE: {
            const propRef = node as unknown as PropertyOrFieldReference;
            const name = typeof propRef.getName === 'function' ? propRef.getName() : '';
            const parent = ancestors[ancestors.length - 1];
            const kind = parent?.nodeType === NodeType.VARIABLE_REFERENCE
              ? SpelReferenceKind.ROOT_PROPERTY : SpelReferenceKind.THIS_PROPERTY;
            refs.push({
              kind, name, path: [name],
              startPos: node.startPos, endPos: node.endPos,
              nodeType: node.nodeType,
            });
            break;
          }
          case NodeType.BEAN_REFERENCE: {
            const beanRef = node as unknown as BeanReference;
            const name = typeof beanRef.getBeanName === 'function' ? beanRef.getBeanName() : '';
            refs.push({
              kind: (typeof beanRef.isFactory === 'function' && beanRef.isFactory())
                ? SpelReferenceKind.BEAN_FACTORY : SpelReferenceKind.BEAN,
              name, path: [name],
              startPos: node.startPos, endPos: node.endPos,
              nodeType: node.nodeType,
            });
            break;
          }
          case NodeType.TYPE_REFERENCE: {
            const typeRef = node as unknown as TypeReference;
            const name = typeof typeRef.getTypeName === 'function' ? typeRef.getTypeName() : '';
            refs.push({
              kind: SpelReferenceKind.TYPE, name, path: [name],
              startPos: node.startPos, endPos: node.endPos,
              nodeType: node.nodeType,
            });
            break;
          }
          default: break;
        }
        return true;
      },
    });
    return refs;
  }

  static #extractFallback(expression: string): SpelReference[] {
    const refs: SpelReference[] = [];
    const varRegex = /#(\w+(?:\.\w+)*)/g;
    let match: RegExpExecArray | null;
    while ((match = varRegex.exec(expression)) !== null) {
      refs.push({
        kind: SpelReferenceKind.VARIABLE, name: match[1]!,
        path: match[1]!.split('.'), startPos: match.index, endPos: match.index + match[0].length,
        nodeType: NodeType.VARIABLE_REFERENCE,
      });
    }
    const beanRegex = /@(\w+)/g;
    while ((match = beanRegex.exec(expression)) !== null) {
      if (match.index > 0 && expression[match.index - 1] === '&') continue;
      refs.push({
        kind: SpelReferenceKind.BEAN, name: match[1]!,
        path: [match[1]!], startPos: match.index, endPos: match.index + match[0].length,
        nodeType: NodeType.BEAN_REFERENCE,
      });
    }
    const factoryRegex = /&@(\w+)/g;
    while ((match = factoryRegex.exec(expression)) !== null) {
      refs.push({
        kind: SpelReferenceKind.BEAN_FACTORY, name: match[1]!,
        path: [match[1]!], startPos: match.index, endPos: match.index + match[0].length,
        nodeType: NodeType.BEAN_REFERENCE,
      });
    }
    const typeRegex = /T\((\w+(?:\.\w+)*)\)/g;
    while ((match = typeRegex.exec(expression)) !== null) {
      refs.push({
        kind: SpelReferenceKind.TYPE, name: match[1]!,
        path: [match[1]!], startPos: match.index, endPos: match.index + match[0].length,
        nodeType: NodeType.TYPE_REFERENCE,
      });
    }
    return refs;
  }
}
