import { frozen, lazyType, RecordClass, recordClassType, recordType, RecordType, type, validating } from "paratype";
import { FlowBatch } from "./FlowBatch";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowRange } from "./FlowRange";
import { TargetOptions, FlowSelection, RemoveFlowSelectionOptions } from "./FlowSelection";
import { FlowTheme } from "./FlowTheme";
import { FormatParagraph } from "./FormatParagraph";
import { FormatText } from "./FormatText";
import { IncrementListLevel } from "./IncrementListLevel";
import { InsertContent } from "./InsertContent";
import { FlowSelectionRegistry } from "./internal/class-registry";
import { transformRangeAfterInsertion, transformRangeAfterRemoval } from "./internal/transform-helpers";
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
        const { first, size } = this.range;
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
                paraStyle = cursor.getParagraphStyle() ?? ParagraphStyle.empty;
                paraTheme = theme?.getParagraphTheme(paraStyle?.variant ?? "normal");
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
            const style = cursor.getTextStyle() ?? TextStyle.empty;
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
        let { range } = this;

        // Examine content if we've got it
        if (content) {
            let foundBreak = false;

            // Check if there's a paragraph break in the selected range
            if (range.size > 0) {
                for (const node of content.peek(range.first).range(range.size)) {
                    if (node instanceof ParagraphBreak) {
                        foundBreak = true;
                        break;
                    }
                }
            }

            // If we didn't find a paragraph break, then we'll try to expand the range
            // to include the closest following paragraph break.
            if (!foundBreak) {
                let delta = 0;
                for (const node of content.peek(range.last).after) {
                    delta += node.size;
                    if (node instanceof ParagraphBreak) {
                        foundBreak = true;
                        break;
                    }
                }

                if (foundBreak) {
                    // We found a break. Inflate range.
                    range = range.inflate(delta);
                } else {
                    // We didn't find a break, so this is a trailing paragraph.
                    // To format it we need to append a styled paragraph break!
                    return new InsertContent({
                        position: range.last + delta,
                        content: FlowContent.fromData([
                            new ParagraphBreak({ style }),
                        ]),
                    });
                }
            }
        }

        if (range.isCollapsed) {
            return null;
        } else {
            return new FormatParagraph({ range, style });
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
    public incrementListLevel(delta = 1): FlowOperation | null {
        const { range } = this;
        if (delta === 0) {
            return null;
        } else {
            return new IncrementListLevel({ range, delta });
        }
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
        
        if (!this.range.isCollapsed) {
            return FlowBatch.fromArray([
                new RemoveRange({ range }),
                new InsertContent({ position, content }),
            ]);
        }

        // We may want to reformat the following paragraph
        let applyNextParaStyle = ParagraphStyle.empty;

        // Is single para break insertion?
        if (content.nodes.length === 1 && content.nodes[0] instanceof ParagraphBreak) {
            // Inserting a para break may split a list node with a counter reset. The intention is then
            // to keep the counter reset on the newly inserted para break and to clear it on the existing
            // (otherwise we would end up with two paras with the same numeric counter value)
            applyNextParaStyle = applyNextParaStyle.set("listCounter", "auto");

            // Do we have a known target?
            if (target) {
                const prev = range.first > 0 ? target.peek(range.first - 1).node : null;
                const cursor = target.peek(range.last);
                const at = cursor.node;

                // Are we inserting between two para breaks?
                if (prev instanceof ParagraphBreak && at instanceof ParagraphBreak) {
                    // If the current paragraph is not of the normal variant then we'll reformat
                    // it to become normal.
                    if (at.style.variant && at.style.variant !== "normal") {
                        return this.formatParagraph(ParagraphStyle.empty.set("variant", "normal"), { target });
                    }

                    // Are we inside a list?
                    if ((at.style.listLevel ?? 0) > 0) {
                        // If the current list marker is hidden, then we'll show it
                        if (at.style.hideListMarker) {
                            return this.unformatParagraph(ParagraphStyle.empty.set("hideListMarker", true));
                        }

                        // Otherwise we'll decrement the current list level
                        return this.decrementListLevel();
                    }
                }

                // Apply next paragraph variant
                if (theme) {                 
                    const splitVarint = cursor.getParagraphStyle()?.variant ?? "normal";
                    const nextVariant = theme.getParagraphTheme(splitVarint).getNextVariant();
                    applyNextParaStyle = applyNextParaStyle.set("variant", nextVariant);
                }
            }
        }

        // Do we have a style to apply on the following paragraph?
        if (!applyNextParaStyle.isEmpty) {
            return FlowBatch.fromArray([
                new InsertContent({ position, content }),
                new FormatParagraph({
                    range: FlowRange.at(position + content.size),
                    style: applyNextParaStyle,
                }),
            ]);
        }

        return new InsertContent({ position, content });
    }

    /**
     * {@inheritDoc FlowSelection.remove}
     * @override
     */
    public remove(options: RemoveFlowSelectionOptions = {}): FlowOperation | null {
        const { whenCollapsed, target } = options;
        let { range } = this;

        if (range.isCollapsed) {
            if (whenCollapsed === "removeBackward" && range.first > 0) {
                if (target) {
                    const paraStyle = target.peek(range.first).getParagraphStyle();
                    const { node: prev } = target.peek(range.first - 1);

                    // Is caret placet just after a paragraph break?
                    if (prev instanceof ParagraphBreak) {
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
                        return FlowBatch.fromArray([
                            new UnformatParagraph({
                                range: FlowRange.at(range.first),
                                style: paraStyle ?? ParagraphStyle.empty,
                            }),
                            new FormatParagraph({
                                range: FlowRange.at(range.first),
                                style: prev.style,
                            }),
                            new RemoveRange({
                                range: FlowRange.at(range.first, -1),
                            }),
                        ]);
                    }
                }
                range = FlowRange.at(range.first, -1);
            } else if (whenCollapsed === "removeForward" && target && range.last < target.size - 1) {
                range = FlowRange.at(range.last, 1);
            } else {
                return null;
            }
        }
        
        return new RemoveRange({ range });
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
}
