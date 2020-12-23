import {NodePart, Part} from './lit-html.js';
/**
 * The state of a NodePart, which can be detached and reattached.
 */
export declare type NodePartState = {};
export declare const detachNodePart: (part: NodePart) => NodePartState;
export declare const restoreNodePart: (
  part: NodePart,
  state: NodePartState
) => void;
export declare const createAndInsertPart: (
  containerPart: NodePart,
  refPart?: NodePart | undefined
) => NodePart;
export declare const setPartValue: <T extends Part>(
  part: T,
  value: unknown,
  index?: number | undefined
) => T;
export declare const getPartValue: (part: NodePart) => unknown;
export declare const insertPartBefore: (
  containerPart: NodePart,
  part: NodePart,
  refPart?: NodePart | undefined
) => void;
export declare const removePart: (part: NodePart) => void;
//# sourceMappingURL=parts.d.ts.map
