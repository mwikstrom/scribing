import { FlowContent } from "../structure/FlowContent";
import { FlowNode } from "../nodes/FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "../selection/FlowRange";
import { FlowSelection } from "../selection/FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "../internal/transform-helpers";
import { NestedFlowSelection } from "../selection/NestedFlowSelection";

/**
 * A nested operation at a specific flow position
 * @public
 */
export abstract class NestedFlowOperation extends FlowOperation {
    /** Position of the nested operation */
    public abstract position: number;

    /** The nested operation */
    public abstract inner: FlowOperation;

    /**
     * Returns a copy of the current object with the specified property merged in
     *
     * @param key - Key of the property to merge in
     * @param value - Property value to merge in
     *
     * @remarks
     * If the resulting object would be equal to the current instance, then the current
     * instance is returned instead.
     */
    public abstract set(key: "position", value: number): this;

    /**
     * Returns a copy of the current object with the specified property merged in
     *
     * @param key - Key of the property to merge in
     * @param value - Property value to merge in
     *
     * @remarks
     * If the resulting object would be equal to the current instance, then the current
     * instance is returned instead.
     */
    public abstract set(key: "inner", value: FlowOperation): this;

    /**
     * Creates a replacement node
     * @param content - The new content of the node that was produced by this operation
     * @param before - The node as it were before this operation was applied
     */
    protected abstract createReplacementNode(content: FlowContent, before: FlowNode): FlowNode;

    /**
     * Gets the target node
     * @param outer - The outer content
     */
    protected getTargetNode(outer: FlowContent): FlowNode {
        const { node, offset } = outer.peek(this.position);
        if (offset === 0 && node && node.size === 1) {
            return node;
        } else {
            throw new Error("Invalid content for nested operation");
        }
    }

    /**
     * Gets the inner content
     * @param outer - The outer content
     */
    protected getInnerContent(outer: FlowContent): FlowContent {
        const node = this.getTargetNode(outer);
        return this.getInnerContentFromNode(node);
    }

    /**
     * Gets the inner content
     * @param node - The selected node
     */
    protected abstract getInnerContentFromNode(node: FlowNode): FlowContent;

    /**
     * Gets the inner theme
     * @param node - The selected node
     * @param outer - The outer theme
     */
    protected abstract getInnerThemeFromNode(node: FlowNode, outer?: FlowTheme): FlowTheme;

    /**
     * {@inheritDoc FlowOperation.afterInsertion}
     * @override
     */
    public afterInsertion(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterInsertion(before, range);
        return this.#wrapPosition(after);
    }

    /**
     * {@inheritDoc FlowOperation.afterRemoval}
     * @override
     */
    public afterRemoval(range: FlowRange): FlowOperation | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterRemoval(before, range);
        return this.#wrapPosition(after);
    }

    /** 
     * {@inheritDoc FlowOperation.invert}
     */
    invert(content: FlowContent): FlowOperation | null {
        const innerContent = this.getInnerContent(content);
        const invertedInner = this.inner.invert(innerContent);
        return this.#wrapInner(invertedInner);
    }

    /** 
     * {@inheritDoc FlowOperation.transform}
     */
    transform(other: FlowOperation): FlowOperation | null {
        if (other instanceof NestedFlowOperation && other.position === this.position) {
            const transformed = this.inner.transform(other.inner);
            return transformed ? other.set("inner", transformed) : null;
        } else {
            return this;
        }
    }

    /** 
     * {@inheritDoc FlowOperation.applyToContent}
     */
    applyToContent(content: FlowContent, theme?: FlowTheme): FlowContent {
        const nodeBefore = this.getTargetNode(content);
        const innerBefore = this.getInnerContentFromNode(nodeBefore);
        const innerTheme = this.getInnerThemeFromNode(nodeBefore, theme);
        const innerAfter = this.inner.applyToContent(innerBefore, innerTheme);
        const nodeAfter = this.createReplacementNode(innerAfter, nodeBefore);
        const range = FlowRange.at(this.position, nodeBefore.size);
        return content.replace(range, nodeAfter);
    }

    /**
     * {@inheritDoc FlowOperation.applyToSelection}
     * @override
     */
    applyToSelection(selection: FlowSelection, mine: boolean): FlowSelection | null {
        if (selection instanceof NestedFlowSelection && selection.position === this.position) {
            return selection.updateInner(inner => this.inner.applyToSelection(inner, mine));
        } else {
            return selection;
        }
    }

    #wrapInner(inner: FlowOperation | null): FlowOperation | null {
        if (inner) {
            return this.set("inner", inner);
        } else {
            return null;
        }
    }

    #wrapPosition(range: FlowRange | null): FlowOperation | null {
        if (range && range.size === 1) {
            return this.set("position", range.first);
        } else {
            return null;
        }
    }
}
