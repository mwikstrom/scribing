/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { frozen, integerType, type, validating } from "paratype";
import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { ParagraphStyle } from "./ParagraphStyle";
import { TextRun } from "./TextRun";

/**
 * Represents a position in flow content
 * @public
 */
@frozen
@validating
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
     * Gets the paragraph style at the current position
     */
    getParagraphStyle(): ParagraphStyle | null {
        return (
            this.node?.getParagraphStyle() || 
            this.moveToStartOfNextNode()?.getParagraphStyle() ||
            null
        );
    }

    /**
     * Gets a new cursor that represents the position at the specified distance from
     * the current position
     * @param distance - The distance to move
     */
    move(@type(integerType) distance: number): FlowCursor {
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

            if (index < 0 || index >= nodes.length) {
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

    moveToStartOfPreviousNode(): FlowCursor | null {
        const index = this.#index - 1;

        if (index < 0) {
            return null;
        }

        const node = this.#content.nodes[index];
        const position = this.#position - this.#offset - node.size;
        return new FlowCursor(this.#content, PRIVATE, index, 0, position);
    }

    moveToStartOfNextNode(): FlowCursor | null {
        const index = this.#index + 1;

        if (index >= this.#content.nodes.length) {
            return null;
        }

        const position = this.#position + this.#content.nodes[this.#index].size - this.#offset;
        return new FlowCursor(this.#content, PRIVATE, index, 0, position);
    }

    moveToStartOfNode(): FlowCursor {
        return this.move(-this.#offset);
    }

    /**
     * Gets a iterable sequence of nodes within the specified distance from the
     * current position
     * @param distance - The distance of the range to get
     */
    range(@type(integerType) distance: number): Iterable<FlowNode> {
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
            }
        }

        return nodes;        
    }
}

const PRIVATE = Symbol();
