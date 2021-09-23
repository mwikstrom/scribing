import { FlowContent } from "./FlowContent";
import { FlowNode } from "./FlowNode";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { FlowSelection, RemoveFlowSelectionOptions, TargetOptions } from "./FlowSelection";
import { FlowTheme } from "./FlowTheme";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
import { TextStyle, TextStyleProps } from "./TextStyle";

/**
 * A nested selection at a specific flow position
 * @public
 */
export abstract class NestedFlowSelection extends FlowSelection {
    /** Position of the nested selection */
    public abstract position: number;

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
     * Gets the inner content
     * @param outer - The outer content
     */
    protected getInnerContent(outer: FlowContent): FlowContent {
        const { node, offset } = outer.peek(this.position);
        const inner = node !== null && offset === 0 ? this.getInnerContentFromNode(node) : null;
        if (inner === null) {
            throw new Error("Invalid content for nested selection");
        } else {
            return inner;
        }
    }

    /**
     * Gets the inner content
     * @param outer - The selected node
     */
    protected abstract getInnerContentFromNode(node: FlowNode): FlowContent | null;

    /**
     * Gets the inner selection
     */
    protected abstract getInnerSelection(): FlowSelection;

    /**
     * Wraps the specified operation so that it applies the outer selection
     * @param inner - The inner operation
     */
    protected abstract getOuterOperation(inner: FlowOperation): FlowOperation;

    /**
     * Returns a copy of this selection with the specified inner selection merged in
     * @param value - The inner selection to be merged in
     */
    protected abstract setInnerSelection(value: FlowSelection): NestedFlowSelection;

    /**
     * {@inheritDoc FlowSelection.isCollapsed}
     * @override
     */
    public get isCollapsed(): boolean {
        const innerSelection = this.getInnerSelection();
        return innerSelection.isCollapsed;
    }

    /**
     * {@inheritDoc FlowSelection.getUniformParagraphStyle}
     * @override
     */
    public getUniformParagraphStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof ParagraphStyleProps>,
    ): ParagraphStyle {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        return innerSelection.getUniformParagraphStyle(innerContent, theme, diff);
    }

    /**
     * {@inheritDoc FlowSelection.getUniformTextStyle}
     * @override
     */
    public getUniformTextStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof TextStyleProps>,
    ): TextStyle {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        return innerSelection.getUniformTextStyle(innerContent, theme, diff);
    }

    /**
     * {@inheritDoc FlowSelection.formatParagraph}
     * @override
     */
    public formatParagraph(
        style: ParagraphStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.formatParagraph(style, innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.formatText}
     * @override
     */
    public formatText(
        style: TextStyle,
        options: TargetOptions = {},
    ): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.formatText(style, innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.incrementListLevel}
     * @override
     */
    public incrementListLevel(content: FlowContent, delta?: number): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerContent = this.getInnerContent(content);
        const innerOperation = innerSelection.incrementListLevel(innerContent, delta);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.insert}
     * @override
     */
    public insert(content: FlowContent, options?: TargetOptions): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.insert(content, innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.remove}
     * @override
     */
    public remove(options: RemoveFlowSelectionOptions = {}): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const innerOperation = innerSelection.remove(innerOptions);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.transformRanges}
     * @override
     */
    public transformRanges(
        transform: (range: FlowRange, options?: TargetOptions) => FlowRange | null,
        options?: TargetOptions
    ): FlowSelection | null {
        const innerSelection = this.getInnerSelection();
        const innerOptions = this.#getInnerOptions(options);
        const transformedInner = innerSelection.transformRanges(transform, innerOptions);
        return this.#wrapSelection(transformedInner);
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(style: ParagraphStyle): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.unformatParagraph(style);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatText(style: TextStyle): FlowOperation | null {
        const innerSelection = this.getInnerSelection();
        const innerOperation = innerSelection.unformatText(style);
        return this.#wrapOperation(innerOperation);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterInsertion(range: FlowRange): FlowSelection | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterInsertion(before, range);
        return this.#wrapPosition(after);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterRemoval(range: FlowRange, mine: boolean): FlowSelection | null {
        const before = FlowRange.at(this.position, 1);
        const after = transformRangeAfterRemoval(before, range, mine);
        return this.#wrapPosition(after);
    }

    #getInnerOptions<T extends TargetOptions>(options?: T): T | undefined {
        if (options) {
            const { target: outer, ...rest } = options;
            if (outer) {
                const target = this.getInnerContent(outer);
                return { target, ...rest } as T;
            }            
        }
        return options;
    }

    #wrapOperation(inner: FlowOperation | null): FlowOperation | null {
        if (inner) {
            return this.getOuterOperation(inner);
        } else {
            return null;
        }
    }

    #wrapPosition(range: FlowRange | null): FlowSelection | null {
        if (range && range.size === 1) {
            return this.set("position", range.first);
        } else {
            return null;
        }
    }

    #wrapSelection(inner: FlowSelection | null): FlowSelection | null {
        if (inner) {
            return this.setInnerSelection(inner);
        } else {
            return null;
        }
    }
}
