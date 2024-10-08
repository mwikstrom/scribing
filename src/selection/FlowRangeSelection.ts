import { lazyType, RecordClass, recordClassType, recordType, RecordType } from "paratype";
import { BoxStyle, BoxStyleProps } from "../styles/BoxStyle";
import { DynamicText } from "../nodes/DynamicText";
import { FlowBatch } from "../operations/FlowBatch";
import { FlowBox } from "../nodes/FlowBox";
import { FlowContent } from "../structure/FlowContent";
import { FlowCursor } from "./FlowCursor";
import { FlowIcon } from "../nodes/FlowIcon";
import { FlowImage } from "../nodes/FlowImage";
import { FlowOperation } from "../operations/FlowOperation";
import { FlowRange } from "./FlowRange";
import { TargetOptions, FlowSelection, RemoveFlowSelectionOptions, VisitRangeOptions } from "./FlowSelection";
import { FlowTheme } from "../styles/FlowTheme";
import { FormatBox } from "../operations/FormatBox";
import { FormatParagraph } from "../operations/FormatParagraph";
import { FormatText } from "../operations/FormatText";
import { ImageSource } from "../structure/ImageSource";
import { InsertContent } from "../operations/InsertContent";
import { FlowSelectionRegistry } from "../internal/class-registry";
import { expandRangeToParagraph } from "../internal/expand-range-to-paragraph";
import { formatListLevel } from "../internal/format-list-level";
import { insertParaBreak } from "../internal/insert-para-break";
import { splitRangeByUniformParagraphStyle } from "../internal/split-range-by-paragraph-style";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";
import { filterNotNull, mapNotNull } from "../not-null";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import {
    OrderedListMarkerKindType,
    ParagraphStyle,
    ParagraphStyleProps,
    UnorderedListMarkerKindType
} from "../styles/ParagraphStyle";
import { RemoveRange } from "../operations/RemoveRange";
import { SetDynamicTextExpression } from "../operations/SetDynamicTextExpression";
import { SetIcon } from "../operations/SetIcon";
import { SetImageSource } from "../operations/SetImageSource";
import { TextStyle, TextStyleProps } from "../styles/TextStyle";
import { UnformatBox } from "../operations/UnformatBox";
import { UnformatParagraph } from "../operations/UnformatParagraph";
import { UnformatText } from "../operations/UnformatText";
import { CellRange } from "./CellRange";
import { UnsetMarkupAttr } from "../operations/UnsetMarkupAttr";
import { StartMarkup } from "../nodes/StartMarkup";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { SetMarkupAttr } from "../operations/SetMarkupAttr";
import { EndMarkup } from "../nodes/EndMarkup";
import { SetMarkupTag } from "../operations/SetMarkupTag";
import { Script } from "../structure/Script";
import { SetImageScale } from "../operations/SetImageScale";
import { FlowVideo } from "../nodes/FlowVideo";
import { VideoSource } from "../structure/VideoSource";
import { SetVideoSource } from "../operations/SetVideoSource";

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
     * {@inheritDoc FlowSelection.getUniformBoxStyle}
     * @override
     */
    public getUniformBoxStyle(
        content: FlowContent,
        theme?: FlowTheme,
        diff?: Set<keyof BoxStyleProps>,
    ): BoxStyle {
        const { first, size } = this.range;
        const cursor = content.peek(first);

        if (!diff) {
            diff = new Set();
        }

        let result = BoxStyle.empty;
        for (const node of cursor.range(size)) {
            if (node instanceof FlowBox) {
                const { style } = node;
                result = result.merge(BoxStyle.ambient.merge(style), diff);
            }
        }

        return result;
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
     * {@inheritDoc FlowSelection.formatList}
     * @override
     */
    public formatList(content: FlowContent, kind: "ordered" | "unordered" | null): FlowOperation | null {
        const { range } = this;
        const insertionStyle = kind === null ? null : ParagraphStyle.empty.merge({
            listLevel: 1,
            listMarker: kind,
        });

        const expanded = expandRangeToParagraph(range, content, insertionStyle);
        if (expanded instanceof FlowOperation) {
            return expanded;
        }

        const splitKeys = ["hideListMarker", "listLevel", "listMarker"] as const;
        const subRanges = splitRangeByUniformParagraphStyle(expanded, content, ...splitKeys);
        const allMarkersHidden = subRanges.every(([,{hideListMarker}]) => hideListMarker);
        const allMarkersShown = subRanges.every(([,{hideListMarker}]) => !hideListMarker);

        return FlowBatch.fromArray(mapNotNull(subRanges, ([r, {listLevel = 0, listMarker}]) => {
            let apply = ParagraphStyle.empty;

            if (listLevel > 0) {
                if (allMarkersHidden && kind !== null) {
                    apply = apply.set("hideListMarker", false);
                } else if (allMarkersShown && kind === null) {
                    apply = apply.set("hideListMarker", true);
                }
            } else if (kind) {
                apply = apply.set("listLevel", 1);
            }
            
            if (
                (kind === "ordered" && !OrderedListMarkerKindType.test(listMarker)) ||
                (kind === "unordered" && !UnorderedListMarkerKindType.test(listMarker))
            ) {
                apply = apply.set("listMarker", kind);
            }

            if (apply.isEmpty) {
                return null;
            }

            return new FormatParagraph({ range: r, style: apply });
        }));
    }

    /**
     * {@inheritDoc FlowSelection.formatBox}
     * @override
     */
    public formatBox(style: BoxStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new FormatBox({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.formatParagraph}
     * @override
     */
    public formatParagraph(style: ParagraphStyle, options: TargetOptions = {}): FlowOperation | null {
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
    public formatText(style: TextStyle): FlowOperation | null {
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
                            current,
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
    public insert(content: FlowContent, options: TargetOptions = {}): FlowOperation | null {
        const { target, theme } = options;
        const { range } = this;
        const { first: position } = range;
        const insertOp = new InsertContent({ position, content });
        
        if (!range.isCollapsed) {
            return FlowBatch.fromArray([
                this.#removeRange(range, target),
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
            return this.#removeRange(range, target);
        } else if (whenCollapsed === "removeBackward" && range.first > 0) {
            return this.#removeCaretBackward(range.first, target);
        } else if (whenCollapsed === "removeForward" && target && range.last < target.size - 1) {
            return this.#removeCaretForward(range.first, target);
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc FlowSelection.setDynamicTextExpression}
     * @override
     */
    public setDynamicTextExpression(content: FlowContent, expression: Script): FlowOperation | null {
        const { range } = this;
        const operations: SetDynamicTextExpression[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof DynamicText) {
                operations.push(new SetDynamicTextExpression({
                    position: position - offset,
                    expression,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.setIcon}
     * @override
     */
    public setIcon(content: FlowContent, data: string): FlowOperation | null {
        const { range } = this;
        const operations: SetIcon[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof FlowIcon) {
                operations.push(new SetIcon({
                    position: position - offset,
                    data,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.setImageSource}
     * @override
     */
    public setImageSource(content: FlowContent, source: ImageSource): FlowOperation | null {
        const { range } = this;
        const operations: SetImageSource[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof FlowImage) {
                operations.push(new SetImageSource({
                    position: position - offset,
                    value: source,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.setVideoSource}
     * @override
     */
    public setVideoSource(content: FlowContent, source: VideoSource): FlowOperation | null {
        const { range } = this;
        const operations: SetVideoSource[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof FlowVideo) {
                operations.push(new SetVideoSource({
                    position: position - offset,
                    value: source,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.setImageScale}
     * @override
     */
    public setImageScale(content: FlowContent, scale: number): FlowOperation | null {
        const { range } = this;
        const operations: SetImageScale[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof FlowImage || node instanceof FlowVideo) {
                operations.push(new SetImageScale({
                    position: position - offset,
                    value: scale,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
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
     * {@inheritDoc FlowSelection.transformRanges}
     * @override
     */
    public visitRanges(
        callback: (range: FlowRange | CellRange, options: VisitRangeOptions) => void,
        options: Partial<VisitRangeOptions> = {},
    ): void {
        const { wrap = FlowSelection.rootWrap, replace = FlowSelection.rootReplace, ...rest } = options;
        callback(this.range, { ...rest, wrap, replace });
    }

    /**
     * {@inheritDoc FlowSelection.unformatParagraph}
     * @override
     */
    public unformatParagraph(style: ParagraphStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new UnformatParagraph({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.unformatBox}
     * @override
     */
    public unformatBox(style: BoxStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new UnformatBox({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.unformatText}
     * @override
     */
    public unformatText(style: TextStyle): FlowOperation | null {
        const { range } = this;
        if (range.isCollapsed) {
            return null;
        } else {
            return new UnformatText({ range, style });
        }
    }

    /**
     * {@inheritDoc FlowSelection.formatTable}
     * @override
     */
    public formatTable(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.unformatTable}
     * @override
     */
    public unformatTable(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.formatTableColumn}
     * @override
     */
    public formatTableColumn(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.unformatTableColumn}
     * @override
     */
    public unformatTableColumn(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.insertTableColumnBefore}
     * @override
     */
    public insertTableColumnBefore(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.insertTableColumnAfter}
     * @override
     */
    public insertTableColumnAfter(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.insertTableRowBefore}
     * @override
     */
    public insertTableRowBefore(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.insertTableRowAfter}
     * @override
     */
    public insertTableRowAfter(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.removeTableColumn}
     * @override
     */
    public removeTableColumn(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.removeTableRow}
     * @override
     */
    public removeTableRow(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.mergeTableCell}
     * @override
     */
    public mergeTableCell(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.splitTableCell}
     * @override
     */
    public splitTableCell(): FlowOperation | null {
        return null;
    }

    /**
     * {@inheritDoc FlowSelection.setMarkupTag}
     * @override
     */
    setMarkupTag(content: FlowContent, tag: string): FlowOperation | null {
        const { range } = this;
        const operations: SetMarkupTag[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof StartMarkup || node instanceof EmptyMarkup || node instanceof EndMarkup) {
                const opposite = 
                    node instanceof StartMarkup ? cursor.findMarkupEnd() :
                        node instanceof EndMarkup ? cursor.findMarkupStart() : null;

                if (opposite && !range.contains(opposite.position)) {
                    operations.push(new SetMarkupTag({
                        position: opposite.position,
                        tag,
                    }));    
                }

                operations.push(new SetMarkupTag({
                    position: position - offset,
                    tag,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.setMarkupAttr}
     * @override
     */
    setMarkupAttr(content: FlowContent, key: string, value: string | Script): FlowOperation | null {
        const { range } = this;
        const operations: SetMarkupAttr[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof StartMarkup || node instanceof EmptyMarkup) {
                operations.push(new SetMarkupAttr({
                    position: position - offset,
                    key,
                    value,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.unsetMarkupAttr}
     * @override
     */
    unsetMarkupAttr(content: FlowContent, key: string): FlowOperation | null {
        const { range } = this;
        const operations: UnsetMarkupAttr[] = [];

        for (
            let cursor: FlowCursor | null = content.peek(range.first);
            cursor?.node && cursor.position < range.last;
            cursor = cursor.moveToStartOfNextNode()
        ) {
            const { node, position, offset } = cursor;
            if (node instanceof StartMarkup || node instanceof EmptyMarkup) {
                operations.push(new UnsetMarkupAttr({
                    position: position - offset,
                    key,
                }));
            }
        }

        return FlowBatch.fromArray(operations);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertFlow}
     * @override
     */
    afterInsertFlow(range: FlowRange, mine: boolean): FlowSelection | null {
        // Translate when insertion is mine and occurs at the caret (collapsed selection)
        if (mine && this.range.isCollapsed && this.range.focus === range.first) {
            return this.set("range", FlowRange.at(range.last));
        }

        const updated = getRangeAfterInsertion(this.range, range);
        return this.set("range", updated);
    }

    /**
     * {@inheritDoc FlowSelection.afterInsertFlow}
     * @override
     */
    afterRemoveFlow(range: FlowRange, mine: boolean): FlowSelection | null {
        const updated = getRangeAfterRemoval(this.range, range, mine);
        if (updated === null) {
            return null;
        } else {
            return this.set("range", updated);
        }
    }

    #removeRange(
        range: FlowRange,
        target?: FlowContent,
    ): FlowOperation | null {
        const defaultOp = new RemoveRange({ range });

        // If we don't know what we're deleting from then we cannot apply special handling
        if (!target) {
            return defaultOp;
        }

        // Check if we're deleting at least one para break (look for the first break in the deleted range)
        const deletedParaCursor = target.peek(range.first).findNodeForward(n => n instanceof ParagraphBreak);
        const deletedParaBreak = (deletedParaCursor?.node ?? null) as (ParagraphBreak | null);

        // Special handling only applies when deleting a para break
        if (!deletedParaCursor || !deletedParaBreak || deletedParaCursor.position > range.last) {
            return defaultOp;
        }

        // Find the resulting/remaining paragraph break
        const remainingParaCursor = target.peek(range.last).findNodeForward(n => n instanceof ParagraphBreak);
        const remainingParaBreak = (remainingParaCursor?.node ?? null) as (ParagraphBreak | null);
        const remainingParaStyle = remainingParaBreak?.style ?? ParagraphStyle.empty;

        // When deleting a paragraph break the intention is to keep
        // the styling of the paragraph that we're deleting into. Therefore we
        // must copy the paragraph style of the node we're deleting and assign
        // it to the remaining paragraph.
        const batch: FlowOperation[] = [defaultOp];
        
        if (remainingParaCursor && remainingParaBreak) {
            // Apply style from prev break
            batch.unshift(new FormatParagraph({
                range: FlowRange.at(remainingParaCursor.position, remainingParaBreak.size),
                style: deletedParaBreak.style,
            }));

            // Unformat any existing style
            if (!remainingParaStyle.isEmpty) {
                batch.unshift(new UnformatParagraph({
                    range: FlowRange.at(remainingParaCursor.position, remainingParaBreak.size),
                    style: remainingParaStyle
                }));
            }
        } else {
            // There is no para break so we're merging in a trailing para.
            // We must therefore insert at copy of the prev break at the end.
            batch.unshift(new InsertContent({
                position: target.size,
                content: new FlowContent({ nodes: Object.freeze([deletedParaBreak]) }),
            }));
        }

        return FlowBatch.fromArray(batch);
    }

    #removeCaretForward(
        position: number,
        target?: FlowContent,
    ): FlowOperation | null {
        // Removing forward from caret is just like removing a range (no additional handling)
        const range = FlowRange.at(position, 1);
        return this.#removeRange(range, target);
    }

    #removeCaretBackward(
        position: number,
        target?: FlowContent,
    ): FlowOperation | null {
        const range = FlowRange.at(position, -1);
        const defaultOp = new RemoveRange({ range });

        // If we don't know what we're deleting from then we cannot apply special handling
        if (!target) {
            return defaultOp;
        }

        // Special handling only applies when deleting a paragraph break
        const { node: deletedNode } = target.peek(position - 1);
        if (!(deletedNode instanceof ParagraphBreak)) {
            return defaultOp;
        }

        // Find the resulting/remaining paragraph break
        const paraCursor = target.peek(position).findNodeForward(n => n instanceof ParagraphBreak);
        const paraBreak = (paraCursor?.node ?? null) as (ParagraphBreak | null);
        const paraStyle = paraBreak?.style ?? ParagraphStyle.empty;

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

        // Apply default handling for removing a range
        return this.#removeRange(range, target);
    }
}
