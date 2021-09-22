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

        const operations: FlowOperation[] = [new InsertContent({ position, content })];

        // Is single para break insertion?
        if (content.nodes.length === 1 && content.nodes[0] instanceof ParagraphBreak) {
            // Do we have a known target?
            if (target) {
                const splitParaCursor = target.peek(range.last).findNodeForward(n => n instanceof ParagraphBreak);

                // Are we splitting a paragraph?
                if (splitParaCursor) {
                    const splitPara = splitParaCursor.node as ParagraphBreak;

                    // If the para that is being split is resetting its counter, then the intention is
                    // to move the counter reset from that para break to the newly inserted break.
                    // We must therefore clear it on split para break (it will be copied automatically)
                    const splitParaListCounter = splitPara.style.get("listCounter");
                    if (splitParaListCounter) {
                        operations.push(new UnformatParagraph({
                            range: FlowRange.at(splitParaCursor.position + content.size, 1),
                            style: ParagraphStyle.empty.set("listCounter", splitParaListCounter),
                        }));
                    }

                    // Are we at the end of a paragraph?
                    if (splitParaCursor.position === range.last) {
                        // The intention is to insert a break so that the next pargraph uses the
                        // next variant (as defined by the theme)
                        if (splitPara.style.variant && splitPara.style.variant !== "normal" && theme) {
                            const nextVariant = theme.getParagraphTheme(splitPara.style.variant).getNextVariant();
                            if (splitPara.style.variant !== nextVariant) {
                                operations.push(new FormatParagraph({
                                    range: FlowRange.at(splitParaCursor.position + content.size, splitPara.size),
                                    style: ParagraphStyle.empty.set("variant", nextVariant),
                                }));
                            }
                        }

                        // Are we at the start of a paragraph (start of flow or after para break)?
                        if (range.first === 0 || target.peek(range.first - 1).node instanceof ParagraphBreak) {
                            // When inserting a para break between two paragraphs, the user is pressing ENTER
                            // in an empty paragraph, then the intention is to reformat the current paragraph
                            // to the next variant (unless it already is of the next variant)
                            if (splitPara.style.variant && splitPara.style.variant !== "normal" && theme) {
                                const nextVariant = theme.getParagraphTheme(splitPara.style.variant).getNextVariant();
                                if (splitPara.style.variant !== nextVariant) {
                                    return new FormatParagraph({
                                        range: FlowRange.at(splitParaCursor.position, splitPara.size),
                                        style: ParagraphStyle.empty.set("variant", nextVariant),
                                    });
                                }
                            }

                            // Are we inside a list?
                            if ((splitPara.style.listLevel ?? 0) > 0) {
                                // If the current list marker is hidden, then we'll show it
                                const { hideListMarker } = splitPara.style;
                                if (hideListMarker) {
                                    return new UnformatParagraph({
                                        range: FlowRange.at(splitParaCursor.position, splitPara.size),
                                        style: ParagraphStyle.empty.set("hideListMarker", hideListMarker),
                                    });
                                }

                                // Otherwise we'll decrement the current list level
                                return new IncrementListLevel({
                                    range: FlowRange.at(splitParaCursor.position, splitPara.size),
                                    delta: -1,
                                });
                            }
                        }
                    }
                }
            }
        }

        return FlowBatch.fromArray(operations);
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
                    const paraCursor = target.peek(range.first).findNodeForward(n => n instanceof ParagraphBreak);
                    const paraBreak = (paraCursor?.node ?? null) as (ParagraphBreak | null);
                    const paraStyle = paraBreak?.style ?? ParagraphStyle.empty;
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
                        const batch: FlowOperation[] = [new RemoveRange({ range: FlowRange.at(range.first, -1) })];
                        
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
