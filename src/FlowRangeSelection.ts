import { frozen, lazyType, RecordClass, recordClassType, recordType, RecordType, type, validating } from "paratype";
import { FlowBatch } from "./FlowBatch";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { TargetOptions, FlowSelection, RemoveFlowSelectionOptions } from "./FlowSelection";
import { FlowTheme } from "./FlowTheme";
import { FormatParagraph } from "./FormatParagraph";
import { FormatText } from "./FormatText";
import { InsertContent } from "./InsertContent";
import { FlowSelectionRegistry } from "./internal/class-registry";
import { expandRangeToParagraph } from "./internal/expand-range-to-paragraph";
import { formatListLevel } from "./internal/format-list-level";
import { insertParaBreak } from "./internal/insert-para-break";
import { splitRangeByUniformParagraphStyle } from "./internal/split-range-by-paragraph-style";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";
import { filterNotNull, mapNotNull } from "./internal/utils";
import { ParagraphBreak } from "./ParagraphBreak";
import { ParagraphStyle, ParagraphStyleProps } from "./ParagraphStyle";
import { RemoveRange } from "./RemoveRange";
import { TextStyle, TextStyleProps } from "./TextStyle";
import { UnformatParagraph } from "./UnformatParagraph";
import { UnformatText } from "./UnformatText";

const Props = {
    range: lazyType(() => FlowRange.classType),
};

const PropsType: RecordType<FlowRangeSelectionProps> = recordType(Props);

/**
 * The base record class for {@link FlowRangeSelection}
 * @public
 */
export const FlowRangeSelectionBase = RecordClass(PropsType, FlowSelection);

/**
 * Properties of flow range selections
 * @public
 */
export interface FlowRangeSelectionProps {
    /** The selected range */
    range: FlowRange;
}

/**
 * Represents a range of selected flow content
 * @public
 * @sealed
 */
@frozen
@validating
@FlowSelectionRegistry.register
export class FlowRangeSelection extends FlowRangeSelectionBase implements Readonly<FlowRangeSelectionProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => FlowRangeSelection);

    /**
     * {@inheritDoc FlowSelection.isCollapsed}
     * @override
     */
    public get isCollapsed(): boolean {
        return this.range.isCollapsed;
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
        const range = expandRangeToParagraph(this.range, content);
        const { first, size } = range;
        const cursor = content.peek(first);
        let paraStyle = cursor.getParagraphStyle() ?? ParagraphStyle.empty;
        let paraTheme = theme?.getParagraphTheme(paraStyle?.variant ?? "normal");

        if (size === 0) {
            const ambient = paraTheme?.getAmbientParagraphStyle() ?? ParagraphStyle.empty;
            return ambient.isEmpty ? paraStyle : ambient.merge(paraStyle);
        }

        if (!diff) {
            diff = new Set();
        }

        let result = ParagraphStyle.empty;
        for (const node of cursor.range(size)) {
            if (node instanceof ParagraphBreak) {
                paraStyle = node.style;
                paraTheme = theme?.getParagraphTheme(paraStyle.variant ?? "normal");
            }
            const style = node.getUniformParagraphStyle(paraTheme, diff);
            if (style) {
                result = result.merge(style, diff);
            }
        }

        return result;
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
        const { first, size } = this.range;
        const cursor = content.peek(first);
        let variant = cursor.getParagraphStyle()?.variant ?? "normal";
        let paraTheme = theme?.getParagraphTheme(variant);
        
        if (size === 0) {            
            const ambient = paraTheme?.getAmbientTextStyle() ?? TextStyle.empty;
            let style = cursor.getTextStyle() ?? TextStyle.empty;

            if (style.link && paraTheme) {
                style = paraTheme.getLinkStyle().merge(style);
            }
    
            return ambient.isEmpty ? style : ambient.merge(style);
        }

        if (!diff) {
            diff = new Set();
        }

        let result = TextStyle.empty;
        for (const node of cursor.range(size)) {
            if (node instanceof ParagraphBreak) {
                variant = node.style.variant ?? "normal";
                paraTheme = theme?.getParagraphTheme(variant);
            } else {
                const style = node.getUniformTextStyle(paraTheme, diff);
                if (style) {
                    result = result.merge(style, diff);
                }
            }
        }

        return result;
    }
 
    /**
     * {@inheritDoc FlowSelection.formatParagraph}
     * @override
     */
    public formatParagraph(
        @type(ParagraphStyle.classType) style: ParagraphStyle,
            options: TargetOptions = {},
    ): FlowOperation | null {
        const { target: content } = options;
        const { range } = this;

        // When applying the normal paragraph variant, then the intention is
        // actually to unformat (clear) that style because the normal variant
        // is implicitly the default variant.
        let unformatNormal = false;
        if (style.has("variant", "normal") && content) {
            style = style.unset("variant");
            unformatNormal = true;
        }

        const expanded = content ? expandRangeToParagraph(range, content, style) : range;

        if (expanded instanceof FlowOperation) {
            return expanded;
        } else if (expanded.isCollapsed) {
            return null;
        } else {
            const formatOp = style.isEmpty ? null : new FormatParagraph({ range: expanded, style });

            if (!unformatNormal || !content) {
                return formatOp;
            }

            return FlowBatch.fromArray(filterNotNull([
                formatOp,
                ...splitRangeByUniformParagraphStyle(expanded, content, "variant").map(
                    ([subrange, { variant }]) => variant ? new UnformatParagraph({
                        range: subrange,
                        style: ParagraphStyle.empty.set("variant", variant),
                    }) : null,
                )
            ]));
        }
    }
    
    /**
     * {@inheritDoc FlowSelection.formatText}
     * @override
     */
    public formatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new FormatText({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.incrementListLevel}
     * @override
     */
    public incrementListLevel(content: FlowContent, delta = 1): FlowOperation | null {
        const { range } = this;
        const insertionStyle = ParagraphStyle.empty.set("listLevel", Math.max(0, Math.min(9, delta)));
        const expanded = expandRangeToParagraph(range, content, insertionStyle);

        if (expanded instanceof FlowOperation) {
            return expanded;
        }

        return FlowBatch.fromArray(
            mapNotNull(
                splitRangeByUniformParagraphStyle(expanded, content, "listLevel"),
                ([subrange, { listLevel: current = 0 }]) => {
                    const target = Math.max(0, Math.min(9, current + delta));
                    if (current === target) {
                        return null;
                    } else {
                        return formatListLevel(
                            subrange,
                            content,
                            target,
                        );
                    }
                },
            )
        );
    }

    /**
     * {@inheritDoc FlowSelection.insert}
     * @override
     */
    public insert(
        @type(FlowContent.classType) content: FlowContent,
            options: TargetOptions = {}
    ): FlowOperation | null {
        const { target, theme } = options;
        const { range } = this;
        const { first: position } = range;
        const insertOp = new InsertContent({ position, content });
        
        if (!this.range.isCollapsed) {
            return FlowBatch.fromArray([
                new RemoveRange({ range }),
                insertOp,
            ]);
        }

        // Is single para break insertion?
        if (content.nodes.length === 1 && content.nodes[0] instanceof ParagraphBreak) {
            return insertParaBreak(insertOp, target, theme);
        }

        return insertOp;
    }

    /**
     * {@inheritDoc FlowSelection.remove}
     * @override
     */
    public remove(options: RemoveFlowSelectionOptions = {}): FlowOperation | null {
        const { whenCollapsed, target } = options;
        const { range } = this;

        if (!range.isCollapsed) {
            return new RemoveRange({ range });
        } else if (whenCollapsed === "removeBackward" && range.first > 0) {
            return this.#removeBackward(range.first, target);
        } else if (whenCollapsed === "removeForward" && target && range.last < target.size - 1) {
            return new RemoveRange({ range: FlowRange.at(range.last, 1) });
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowSelection.transformRanges}
     * @override
     */
    public transformRanges(
        transform: (range: FlowRange, options?: TargetOptions) => FlowRange | null,
        options?: TargetOptions
    ): FlowSelection | null {
        const result = transform(this.range, options);
        if (result === this.range) {
            return this;
        } else if (result === null) {
            return null;
        } else {
            return this.set("range", result);
        }
    }    

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(@type(ParagraphStyle.classType) style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new UnformatParagraph({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.unformatText}
     * @override
     */
    public unformatText(@type(TextStyle.classType) style: TextStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new UnformatText({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterInsertion(range: FlowRange, mine: boolean): FlowSelection | null {
        // Translate when insertion is mine and occurs at the current carent (collapsed selection)
        if (mine && this.range.isCollapsed && this.range.focus === range.first) {
            return this.set("range", FlowRange.at(range.last));
        }

        const updated = transformRangeAfterInsertion(this.range, range);
        return this.set("range", updated);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertion}
     * @override
     */
    afterRemoval(range: FlowRange, mine: boolean): FlowSelection | null {
        const updated = transformRangeAfterRemoval(this.range, range, mine);
        if (updated === null) {
            return null;
        } else {
            return this.set("range", updated);
        }
    }

    #removeBackward(
        position: number,
        target?: FlowContent,
    ): FlowOperation | null{
        const defaultOp = new RemoveRange({ range: FlowRange.at(position, -1) });

        if (!target) {
            return defaultOp;
        }

        const paraCursor = target.peek(position).findNodeForward(n => n instanceof ParagraphBreak);
        const paraBreak = (paraCursor?.node ?? null) as (ParagraphBreak | null);
        const paraStyle = paraBreak?.style ?? ParagraphStyle.empty;
        const { node: prev } = target.peek(position - 1);

        if (!(prev instanceof ParagraphBreak)) {
            return defaultOp;
        }

        // Are we at the start of a list item?
        if ((paraStyle?.listLevel ?? 0) > 0) {
            // Is the list marker shown?
            if (!paraStyle?.hideListMarker) {
                // Intention is not to delete prev paragraph break, but
                // instead to hide the list marker of the current para.
                return this.formatParagraph(
                    ParagraphStyle.empty.set("hideListMarker", true),
                    { target },
                );
            }
        }

        // When deleting a paragraph break backward, the intention is to keep
        // the styling of the paragraph that we're deleting into. Therefore we
        // must copy the paragraph style of the node we're deleting and assign
        // it to the current paragraph.
        const batch: FlowOperation[] = [new RemoveRange({ range: FlowRange.at(position, -1) })];
        
        if (paraCursor && paraBreak) {
            // Apply style from prev break
            batch.unshift(new FormatParagraph({
                range: FlowRange.at(paraCursor.position, paraBreak.size),
                style: prev.style,
            }));

            // Unformat any existing style
            if (!paraStyle.isEmpty) {
                batch.unshift(new UnformatParagraph({
                    range: FlowRange.at(paraCursor.position, paraBreak.size),
                    style: paraStyle
                }));
            }
        } else {
            // There is no para break so we're merging in a trailing para.
            // We must therefore insert at copy of the prev break at the end.
            batch.unshift(new InsertContent({
                position: target.size,
                content: new FlowContent({ nodes: Object.freeze([prev]) }),
            }));
        }

        return FlowBatch.fromArray(batch);
    }
}
