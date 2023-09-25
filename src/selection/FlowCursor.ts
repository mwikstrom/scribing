/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "../nodes/FlowNode";
import { InlineNode } from "../nodes/InlineNode";
import { LineBreak } from "../nodes/LineBreak";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import { TextRun } from "../nodes/TextRun";
import { TextStyle } from "../styles/TextStyle";
import { StartMarkup } from "../nodes/StartMarkup";
import { EndMarkup } from "../nodes/EndMarkup";

/**
 * Represents a position in flow content
 * @public
 */
export class FlowCursor {
    readonly #content: FlowContent;
    readonly #index: number;
    readonly #offset: number;
    readonly #position: number;

    /** @internal */
    constructor(content: FlowContent)
    /** @internal */
    constructor(content: FlowContent, symbol: symbol, index: number, offset: number, position: number)
    constructor(content: FlowContent, symbol?: symbol, index?: number, offset?: number, position?: number) {
        if (symbol === PRIVATE) {
            this.#content = content;
            this.#index = index!;
            this.#offset = offset!;
            this.#position = position!;
        } else {
            const error = FlowContent.classType.error(content);
            if (error){
                throw new TypeError(`new ${FlowCursor.name}(...): Invalid argument: ${error}`);
            }

            this.#content = content;
            this.#index = 0;
            this.#offset = 0;
            this.#position = 0;
        }
    }

    /**
     * Gets the current position
     */
    get position(): number {
        return this.#position;
    }

    /**
     * Gets the current node index
     */
    get index(): number {
        return this.#index;
    }

    /** 
     * Gets the current node when the cursor is positioned before the first,
     * or after the last node.
     */
    get node(): FlowNode | null {
        const { nodes } = this.#content;
        return this.#index >= 0 && this.#index < nodes.length ? nodes[this.#index] : null;
    }

    /**
     * Gets the current offset within the current node
     */
    get offset(): number {
        return this.#offset;
    }

    /**
     * Gets an iterable sequence of nodes before the current position
     */
    get before(): Iterable<FlowNode> {
        return this.range(-this.#position);
    }

    /**
     * Gets an iterable sequence of nodes after the current position
     */
    get after(): Iterable<FlowNode> {
        return this.range(this.#content.size - this.#position);
    }

    /**
     * Finds a node in the forward direction that matches a predicate
     */
    findNodeForward(predicate: (node: FlowNode) => boolean): FlowCursor | null {
        const { nodes } = this.#content;
        let distance = 0;

        for (let index = this.#index; index < nodes.length; ++index) {
            const node = nodes[index];
            if (predicate(node)) {
                return new FlowCursor(this.#content, PRIVATE, index, 0, this.#position + distance);
            } else if (index === this.#index) {
                distance = node.size - this.#offset;
            } else {
                distance += node.size;
            }
        }

        return null;
    }

    /**
     * Finds a node in the backward direction that matches a predicate
     */
    findNodeBackward(predicate: (node: FlowNode) => boolean): FlowCursor | null {
        const { nodes } = this.#content;
        let distance = 0;

        for (let index = this.#index; index >= 0; --index) {
            const node = nodes[index];
            if (index !== this.#index) {
                distance -= node.size;
            }
            if (predicate(node)) {
                return new FlowCursor(this.#content, PRIVATE, index, 0, this.#position + distance);
            } else if (index === this.#index) {
                distance = -this.#offset;
            }
        }

        return null;
    }

    findMarkupEnd(): FlowCursor | null {
        const { node } = this;
        if (node instanceof StartMarkup) {
            const stack = [node.tag];
            return this.moveToStartOfNextNode()?.findNodeForward(next => {
                if (next instanceof StartMarkup) {
                    stack.push(next.tag);
                } else if (next instanceof EndMarkup && next.tag === stack[stack.length - 1]) {
                    stack.pop();
                }
                return stack.length === 0;
            }) ?? null;
        } else {
            return null;
        }
    }

    findMarkupStart(): FlowCursor | null {
        const { node } = this;
        if (node instanceof EndMarkup) {
            const stack = [node.tag];
            return this.moveToStartOfPreviousNode()?.findNodeBackward(prev => {
                if (prev instanceof EndMarkup) {
                    stack.push(prev.tag);
                } else if (prev instanceof StartMarkup && prev.tag === stack[stack.length - 1]) {
                    stack.pop();
                }
                return stack.length === 0;
            }) ?? null;
        } else {
            return null;
        }
    }

    /**
     * Gets the paragraph style at the current position
     */
    getParagraphStyle(): ParagraphStyle | null {
        const found = this.findNodeForward(node => node instanceof ParagraphBreak)?.node;
        if (!found) {
            return null;
        }
        return (found as ParagraphBreak).style;
    }

    /**
     * Gets the text style at the current position
     */
    getTextStyle(): TextStyle | null {
        const { nodes } = this.#content;
        let index = this.#index;
        let { node } = this;
        let forward: TextStyle | null = null;

        if (node instanceof InlineNode) {
            if (this.#offset > 0) {
                return node.style;
            }
            forward = node.style;
        }

        while (index > 0) {
            node = nodes[--index];
            if (
                node instanceof ParagraphBreak ||
                node instanceof LineBreak
            ) {
                break;
            } else if (node instanceof InlineNode) {
                return node.style;
            }
        }

        return forward;
    }

    /**
     * Gets a new cursor that represents the position at the specified distance from
     * the current position
     * @param distance - The distance to move
     * @param throwIfOutOfRange - Optional. `RangeError` is thrown when `true` and the resulting position is not valid.
     */
    move(distance: number, throwIfOutOfRange = false): FlowCursor {
        if (distance === 0) {
            return this;
        }

        const { nodes } = this.#content;
        let index = this.#index;
        let offset = this.#offset;
        let position = this.#position;

        const forward = distance >= 0;
        const sign = forward ? 1 : -1;
        distance = Math.abs(distance);
        let leftInNode = forward ? nodes[index]?.size - offset : offset;

        while (distance > 0) {
            if (
                leftInNode > distance || 
                (
                    leftInNode === distance && 
                    (
                        !forward || 
                        (index === nodes.length - 1)
                    )
                )
            ) {
                offset += distance * sign;
                position += distance * sign;
                break;
            } 
            
            index += sign;

            if (!throwIfOutOfRange) {
                if (index < 0) {
                    return this.moveToStart();
                } else if (index >= nodes.length) {
                    return this.moveToEnd();
                }
            } else if (index < 0 || index >= nodes.length) {
                throw new RangeError("Invalid flow position");
            }

            distance -= leftInNode;
            position += leftInNode * sign;

            if (forward) {
                offset = 0;
                leftInNode = nodes[index].size;
            } else {
                offset = nodes[index].size;
                leftInNode = offset;
            }
        }

        return new FlowCursor(this.#content, PRIVATE, index, offset, position);
    }

    /**
     * Gets a new cursor that is positioned at the start of the first node
     */
    moveToStart(): FlowCursor {
        return new FlowCursor(this.#content, PRIVATE, 0, 0, 0);
    }

    /**
     * Gets a new curstor that is positioned at the end of the last node
     */
    moveToEnd(): FlowCursor {
        let index = 0;
        let offset = 0;
        let position = 0;

        if (this.#content.nodes.length > 0) {
            index = this.#content.nodes.length - 1;
            const node = this.#content.nodes[index];
            offset = node.size;
            position = this.#content.size;
        }

        return new FlowCursor(this.#content, PRIVATE, index, offset, position);
    }

    /**
     * Gets a new cursor that is positioned at the start of the previous node, or
     * `null` when the current cursor is positioned at the first node.
     */
    moveToStartOfPreviousNode(): FlowCursor | null {
        const index = this.#index - 1;

        if (index < 0) {
            return null;
        }

        const node = this.#content.nodes[index];
        const position = this.#position - this.#offset - node.size;
        return new FlowCursor(this.#content, PRIVATE, index, 0, position);
    }

    /**
     * Gets a new cursor that is positioned at the start of the next node, or
     * `null` when the current cursor is positioned at the last node.
     */
    moveToStartOfNextNode(): FlowCursor | null {
        const index = this.#index + 1;

        if (index >= this.#content.nodes.length) {
            return null;
        }

        const position = this.#position + this.#content.nodes[this.#index].size - this.#offset;
        return new FlowCursor(this.#content, PRIVATE, index, 0, position);
    }

    /**
     * Gets a cursor that is positioned at the start of the current node.
     */
    moveToStartOfNode(): FlowCursor {
        return this.move(-this.#offset);
    }

    /**
     * Gets a iterable sequence of nodes within the specified distance from the
     * current position
     * @param distance - The distance of the range to get
     */
    range(distance: number): Iterable<FlowNode> {
        const end = this.move(distance);
        const firstIndex = distance >= 0 ? this.#index : end.#index;
        const lastIndex = distance >= 0 ? end.#index : this.#index;
        const firstOffset = distance >= 0 ? this.#offset : end.#offset;
        const lastOffset = distance >= 0 ? end.#offset : this.#offset;
        const nodes = this.#content.nodes.slice(firstIndex, lastOffset > 0 ? lastIndex + 1 : lastIndex);

        if (lastOffset > 0) {
            const lastNode = nodes[nodes.length - 1];
            if (TextRun.classType.test(lastNode) && lastOffset < lastNode.size) {
                nodes[nodes.length - 1] = lastNode.before(lastOffset);
            }
        }

        if (firstOffset > 0) {
            const firstNode = nodes[0];
            if (TextRun.classType.test(firstNode)) {
                nodes[0] = firstNode.after(firstOffset);
            } else if (firstNode) {
                nodes.splice(0, 1);
            }
        }

        return nodes;        
    }
}

const PRIVATE = Symbol();
