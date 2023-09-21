import { DynamicText } from "../nodes/DynamicText";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { FlowBox } from "../nodes/FlowBox";
import { FlowIcon, PredefinedIconType } from "../nodes/FlowIcon";
import { FlowImage } from "../nodes/FlowImage";
import { FlowNode } from "../nodes/FlowNode";
import { FlowTable } from "../nodes/FlowTable";
import { LineBreak } from "../nodes/LineBreak";
import { TextRun } from "../nodes/TextRun";
import { FlowContent } from "../structure/FlowContent";
import { FlowTableContent } from "../structure/FlowTableContent";
import { AsyncFlowNodeVisitor } from "../structure/AsyncFlowNodeVisitor";
import { EndScopeFunc, XmlWriter } from "./XmlWriter";
import { ThemeManager } from "./ThemeManager";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { FlowCursor } from "../selection/FlowCursor";
import { ListMarkerKind, OrderedListMarkerKindType, ParagraphStyle } from "../styles/ParagraphStyle";
import type {
    FlowContentHtmlClassKey,
    FlowContentHtmlOptions,
    HtmlContent,
    HtmlElem,
    HtmlNode
} from "./serialize-html";
import { Attributes, Element as XmlElem } from "xml-js";
import { InlineNode } from "../nodes/InlineNode";
import { Interaction } from "../interaction/Interaction";
import { OpenUrl } from "../interaction/OpenUrl";
import { RunScript } from "../interaction/RunScript";
import { BoxStyle } from "../styles/BoxStyle";
import { getTableColumnWidths } from "../structure/getTableColumnWidths";
import { CellPosition } from "../selection/CellPosition";

/** @internal */
export class HtmlSerializer extends AsyncFlowNodeVisitor {
    readonly #replacements: WeakMap<EmptyMarkup, HtmlContent>;
    readonly #classes: Partial<Record<FlowContentHtmlClassKey, string>>;
    readonly #theme: ThemeManager;
    readonly #getElementId: Exclude<FlowContentHtmlOptions["getElementId"], undefined>;
    readonly #getLinkHref: Exclude<FlowContentHtmlOptions["getLinkHref"], undefined>;
    readonly #getImageUrl: Exclude<FlowContentHtmlOptions["getImageUrl"], undefined>;
    readonly #registerScriptInteraction: Exclude<FlowContentHtmlOptions["registerScriptInteraction"], undefined>;
    readonly #registerDynamicText: Exclude<FlowContentHtmlOptions["registerDynamicText"], undefined>;
    readonly #registerDataSource: Exclude<FlowContentHtmlOptions["registerDataSource"], undefined>;
    readonly #writer = new XmlWriter();
    readonly #endArticle: EndScopeFunc;
    readonly #listCounter = new Map<number, number>();

    constructor(
        replacements: WeakMap<EmptyMarkup, HtmlContent>,
        options: Omit<FlowContentHtmlOptions, "rewriteMarkup">
    ) {
        super();

        this.#replacements = replacements;
        this.#classes = options.classes || {};
        this.#theme = new ThemeManager(options.theme);
        this.#getElementId = options.getElementId || makeDefaultElementIdGenerator();
        this.#getLinkHref = options.getLinkHref || (url => url);
        this.#getImageUrl = options.getImageUrl || (src => src.url);
        this.#registerScriptInteraction = options.registerScriptInteraction || (() => void 0);
        this.#registerDynamicText = options.registerDynamicText || (() => void 0);
        this.#registerDataSource = options.registerDataSource || (() => void 0);
        this.#endArticle = this.#writer.start("article");
    }
    
    getResult(): string {
        this.#endArticle();
        const result = this.#writer.toString();
        this.#writer.reset();
        return result;
    }

    async visitFlowContent(content: FlowContent): Promise<FlowContent> {
        let endPara: EndScopeFunc | undefined;
        let activeLink: CurrentLink | undefined;
        const listStack: ListStackEntry[] = [];
        const endList = () => {
            listStack.splice(0, listStack.length).reverse().forEach(({ endList, endItem }) => {
                endItem();
                endList();
            });
        };
        
        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (!endPara) {
                const paraBreak = cursor.findNodeForward(ParagraphBreak.classType.test)?.node;
                if (paraBreak instanceof ParagraphBreak) {
                    this.#updateListStack(paraBreak.style, listStack);
                    endPara = this.#startPara(paraBreak.style);
                } else {
                    endList();
                    endPara = () => void 0;
                }
            }
            
            const { node } = cursor;
            let linkInteraction: Interaction | null | undefined;

            if (node instanceof InlineNode) {
                linkInteraction = node.style.link;
            }
    
            if (activeLink) {
                if (!linkInteraction || !Interaction.baseType.equals(linkInteraction, activeLink.interaction)) {
                    activeLink.end();
                    activeLink = undefined;
                }
            }
    
            if (linkInteraction && !activeLink) {
                activeLink = {
                    interaction: linkInteraction,
                    end: this.#startLink(linkInteraction),
                };
            }
    
            if (node) {
                await this.visitNode(node);
            }

            if (node instanceof ParagraphBreak && endPara) {
                endPara();
                endPara = undefined;
            }            
        }

        if (activeLink) {
            activeLink.end();
        }

        if (endPara) {
            endPara();
        }

        endList();

        return content;
    }

    async visitDynamicText(node: DynamicText): Promise<FlowNode> {
        const id = this.#getElementId("dynamic");
        this.#registerDynamicText(id, node.expression, node.style);
        this.#writer.elem("span", { id, class: "dynamic" }, HELLIP);
        return node;
    }

    async visitEmptyMarkup(node: EmptyMarkup): Promise<FlowNode> {
        const html = this.#replacements.get(node);
        if (html) {
            await this.#writeHtmlContent(html);
        }
        return node;
    }

    async visitBox(node: FlowBox): Promise<FlowNode> {
        const { style, content } = node;
        const ambient = BoxStyle.ambient;
        const { variant = "basic", inline = true, color = "default", source, interaction } = style.unmerge(ambient);
        const classNames = [
            this.#getClassName("box"),
            this.#getClassName(`${variant}Box`),
            this.#getClassName(`${color}Color`),
        ];

        if (inline) {
            classNames.push(this.#getClassName("inlineBox"));
        }

        let endWrapper: EndScopeFunc | undefined;
        if (source) {
            const id = this.#getElementId("template");
            this.#registerDataSource(id, source);
            endWrapper = this.#writer.start("template", { id });
        }

        const attr: Attributes = { class: classNames.join(" ") };
        let tagName = "div";
        
        if (interaction) {
            tagName = "button";
            if (interaction instanceof OpenUrl) {
                const href = this.#getLinkHref(interaction.url);
                attr.onclick = `document.location.href=${JSON.stringify(href)}`;
            } else if (interaction instanceof RunScript) {
                const id = this.#getElementId("button");
                this.#registerScriptInteraction(id, interaction.script);
                attr.id = id;
            } else {
                throw new Error("Unsupported box interaction"); 
            }
        }

        const endTheme = this.#theme.startBox(style);
        const endElem = this.#writer.start(tagName, attr);

        await this.visitFlowContent(content);

        endElem();
        endTheme();

        if (endWrapper) {
            endWrapper();
        }

        return node;
    }

    async visitIcon(node: FlowIcon): Promise<FlowNode> {
        const { data, style } = node;
        const ambient = this.#theme.text;
        const { fontSize, color } = style.unmerge(ambient);
        const classNames = [this.#getClassName("icon")];
        const css = new Map<string, string>();
        const content: XmlElem[] = [];
        let tagName = "span";

        if (fontSize) {
            css.set("font-size", `${fontSize / 100}rem`);
        }

        if (color) {
            classNames.push(this.#getClassName(`${color}Color`));
        }

        if (PredefinedIconType.test(data)) {
            classNames.push(this.#getClassName(`${data}Icon`));
        } else if (/^@mdi\//.test(data)) {
            classNames.push("mdi", `mdi-${data.substring(5)}`);
        } else {
            tagName = "svg";
            content.push({ type: "element", name: "path", attributes: { d: data } });
        }

        const attr: Record<string, string> = { class: classNames.join(" ") };

        if (css.size > 0) {
            attr.style = [...css].map(([key, value]) => `${key}:${value}`).join(";");
        }

        if (tagName === "svg") {
            attr.viewBox = "0 0 24 24";
        }

        this.#writer.elem(tagName, attr, content);

        return node;
    }

    async visitImage(node: FlowImage): Promise<FlowNode> {
        const { source, scale } = node;
        const width = Math.round(source.width * scale);
        const height = Math.round(source.height * scale);
        const src = this.#getImageUrl(source, scale);
        this.#writer.elem("img", { src, width, height });
        return node;
    }

    async visitTable(node: FlowTable): Promise<FlowNode> {
        const { columns, style, content } = node;
        const { inline, head } = style;
        let attr: Attributes | undefined;
        
        if (inline) {
            attr = { class: this.#getClassName("inlineTable") };
        }

        const endTable = this.#writer.start("table", attr);
        const endColGroup = this.#writer.start("colgroup");
        
        getTableColumnWidths(content.columnCount, columns)
            .forEach(value => this.#writer.elem("col", { style: `width:${value}`}));
        endColGroup();
        await this.visitTableContent(content, head);
        endTable();

        return node;
    }

    async visitTableContent(content: FlowTableContent, headingRowCount = 0): Promise<FlowTableContent> {
        const spanned = new Set<string>();
        let endGroup: EndScopeFunc | undefined;
        let head = false;

        for (let r = 0; r < content.rowCount; ++r) {
            if (headingRowCount > 0) {
                if (!endGroup) {
                    endGroup = this.#writer.start("thead");
                    head = true;
                } else if (r >= headingRowCount) {
                    endGroup();
                    endGroup = this.#writer.start("tbody");
                    head = false;
                }
            } else if (!endGroup) {
                endGroup = this.#writer.start("tbody");
            }

            const endRow = this.#writer.start("tr");

            for (let c = 0; c < content.columnCount; ++c) {
                const pos = CellPosition.at(r, c);
                const key = pos.toString();
                if (!spanned.has(key)) {
                    const cell = content.getCell(pos);
                    if (cell) {
                        const { content: cellContent, colSpan, rowSpan } = cell;
                        await this.#visitTableCell(pos, cellContent, spanned, head, colSpan, rowSpan);
                    } else {
                        await this.#visitTableCell(pos, content.defaultCellContent, spanned, head);
                    }
                }
            }

            endRow();
        }

        if (endGroup) {
            endGroup();
        }

        return content;
    }

    async visitLineBreak(node: LineBreak): Promise<FlowNode> {
        this.#writer.elem("br");
        return node;
    }

    async visitTextRun(node: TextRun): Promise<FlowNode> {
        const { text, style } = node;
        const ambient = this.#theme.text;
        const { fontFamily, fontSize, color, underline, strike, bold, italic, baseline } = style.unmerge(ambient);
        const classNames = [this.#getClassName("text")];
        const css = new Map<string, string>();

        if (fontFamily) {
            classNames.push(this.#getClassName(`${fontFamily}Font`));
        }

        if (fontSize) {
            css.set("font-size", `${fontSize / 100}rem`);
        }

        if (color) {
            classNames.push(this.#getClassName(`${color}Color`));
        }

        if (typeof underline === "boolean") {
            classNames.push(this.#getClassName(underline ? "underline" : "notUnderline"));
        }

        if (typeof strike === "boolean") {
            classNames.push(this.#getClassName(strike ? "strike" : "notStrike"));
        }

        if (typeof bold === "boolean") {
            classNames.push(this.#getClassName(bold ? "bold" : "notBold"));
        }

        if (typeof italic === "boolean") {
            classNames.push(this.#getClassName(italic ? "italic" : "notItalic"));
        }

        if (baseline === "sub") {
            classNames.push(this.#getClassName("sub"));
        } else if (baseline === "super") {
            classNames.push(this.#getClassName("super"));
        } else if (baseline === "normal") {
            classNames.push(this.#getClassName("normalBaseline"));
        }

        const attr: Attributes = {
            class: classNames.join(" "),
        };

        if (css.size > 0) {
            attr.style = [...css].map(([key, value]) => `${key}:${value}`).join(";");
        }

        this.#writer.elem("span", attr, text);
        return node;
    }

    async #visitTableCell(
        pos: CellPosition,
        content: FlowContent,
        spanned: Set<string>,
        head = false,
        colSpan = 1,
        rowSpan = 1
    ): Promise<void> {
        const tagName = head ? "th" : "td";
        const attr: Attributes = {};

        if (colSpan > 1) {
            attr.colspan = colSpan;
        }

        if (rowSpan > 1) {
            attr.rowspan = rowSpan;
        }

        for (let r = 0; r < rowSpan; ++r) {
            for (let c = 0; c < colSpan; ++c) {
                spanned.add(CellPosition.at(pos.row + r, pos.column + c).toString());
            }
        }

        const endCell = this.#writer.start(tagName, attr);
        await this.visitFlowContent(content);
        endCell();
    }

    #getClassName(key: FlowContentHtmlClassKey): string {
        return this.#classes[key] || key;
    }

    #updateListStack(style: ParagraphStyle, stack: ListStackEntry[]): void {
        const { listLevel = 0, hideListMarker, listMarker: marker } = style;

        if (!marker) {
            stack.splice(0, stack.length).reverse().forEach(({ endItem, endList }) => {
                endItem();
                endList();
            });
            return;
        }

        const insideList = stack.length > 0;

        if (stack.length > listLevel) {
            stack.splice(listLevel, stack.length - listLevel).reverse().forEach(({ endItem, endList }) => {
                endItem();
                endList();
            });
        }

        if (listLevel > 0 && stack.length === listLevel) {
            const entry = stack[listLevel - 1];
            if (!this.#canContinueList(entry, style)) {
                entry.endItem();
                entry.endList();
                stack.pop();
            } else if (!hideListMarker) {
                entry.endItem();
                entry.endItem = this.#startListItem(style);
            }
        }

        if (listLevel > stack.length) {
            while (listLevel > stack.length + 1) {
                stack.push({
                    endList: this.#startList(style, stack.length + 1, insideList),
                    endItem: () => void 0,
                    marker
                });
            }

            stack.push({
                endList: this.#startList(style, listLevel, insideList),
                endItem: this.#startListItem(style),
                marker
            });
        }
    }

    #canContinueList(entry: ListStackEntry, style: ParagraphStyle): boolean {
        const { marker: entryMarker } = entry;
        const { listLevel = 0, listMarker, listCounter = "auto" } = style;

        if (entryMarker !== listMarker || listCounter === "reset") {
            return false;
        }
        
        if (listCounter === "auto" || listCounter === "resume" || !OrderedListMarkerKindType.test(listMarker)) {
            return true;
        }

        const nextCounter = 1 + (this.#listCounter.get(listLevel) || 0);
        return listCounter === nextCounter;
    }

    #startList(style: ParagraphStyle, level: number, insideList: boolean): EndScopeFunc {
        const { listMarker, listCounter = "auto" } = style;
        const attr: Attributes = {};
        let tagName: string;

        if (OrderedListMarkerKindType.test(listMarker)) {
            tagName = "ol";
        } else {
            tagName = "ul";            
        }

        if (listCounter === "reset" || (listCounter === "auto" && !insideList)) {
            this.#listCounter.delete(level);
        } else {
            let start: number;
            if (typeof listCounter === "number") {
                start = listCounter;
                this.#listCounter.set(level, start - 1);
            } else {
                start = 1 + (this.#listCounter.get(level) || 0);
            }
            if (start !== 1 && tagName === "ol") {
                attr.start = start.toFixed();
            }
        }

        if (listMarker === "dash") {
            attr.class = this.#getClassName("dashListMarker");
        } else if (listMarker !== "ordered" && listMarker !== "unordered" && listMarker) {
            attr.style = `list-style-type:${listMarker}`;
        }

        return this.#writer.start(tagName, attr);
    }

    #startListItem(style: ParagraphStyle): EndScopeFunc {
        const { hideListMarker, listCounterPrefix, listCounterSuffix, listLevel } = style;
        const attr: Attributes = {};

        if (listLevel) {
            for (const [key, value] of [...this.#listCounter]) {
                if (key > listLevel) {
                    this.#listCounter.delete(key);
                } else if (key === listLevel) {
                    this.#listCounter.set(key, value + 1);
                }
            }
            if (!this.#listCounter.has(listLevel)) {
                this.#listCounter.set(listLevel, 1);
            }
        }

        if (hideListMarker) {
            attr.style = "list-style-type:none";
        } else {
            if (listCounterPrefix) {
                attr["data-list-counter-prefix"] = listCounterPrefix;
            }
            if (listCounterSuffix) {
                attr["data-list-counter-suffix"] = listCounterSuffix;
            }
        }

        return this.#writer.start("li", attr);
    }

    #startPara(style: ParagraphStyle): EndScopeFunc {
        const { variant = "normal" } = style;
        const ambient = this.#theme.para.getAmbientParagraphStyle();
        const { alignment, direction, lineSpacing, spaceBefore, spaceAfter } = style.unmerge(ambient);
        let tagName = "p";
        const classNames: string[] = [];
        const css = new Map<string, string>();

        if (/^h[1-6]$/.test(variant)) {
            tagName = variant;
        } else if (variant === "title" || variant === "subtitle" || variant === "preamble") {
            classNames.push(this.#getClassName(variant));
        } else if (variant === "code") {
            classNames.push(this.#getClassName("codeBlock"));
        }

        if (alignment) {
            classNames.push(this.#getClassName(`${alignment}Align`));
        }

        if (direction) {
            classNames.push(this.#getClassName(`${direction}Direction`));
        }

        if (lineSpacing) {
            css.set("line-height", `${lineSpacing}%`);
        }

        if (spaceBefore) {
            css.set("padding-block-start", `${spaceBefore / 100}rem`);
        }

        if (spaceAfter) {
            css.set("padding-block-end", `${spaceAfter / 100}rem`);
        }

        const attr: Attributes = {};
        
        if (classNames.length > 0) {
            attr.class = classNames.join(" ");
        }

        if (css.size > 0) {
            attr.style = [...css].map(([key, value]) => `${key}:${value}`).join(";");
        }

        const endElem = this.#writer.start(tagName, attr);
        const endTheme = this.#theme.startPara(variant);

        return () => {
            endTheme();
            endElem();
        };
    }

    #startLink(interaction: Interaction): EndScopeFunc {
        let endElem: EndScopeFunc;

        if (interaction instanceof OpenUrl) {
            const href = this.#getLinkHref(interaction.url);
            endElem = this.#writer.start("a", { href });
        } else if (interaction instanceof RunScript) {
            const id = this.#getElementId("link");
            this.#registerScriptInteraction(id, interaction.script);
            endElem = this.#writer.start("a", { id, href: `#${id}` });
        } else {
            throw new Error("Unsupported link interaction");
        }

        const endTheme = this.#theme.startLink();

        return () => {
            endTheme();
            endElem();
        };
    }

    async #writeHtmlContent(content: HtmlContent): Promise<void> {
        if (Array.isArray(content)) {
            for (const node of content) {
                await this.#writeHtmlNode(node);
            }
        } else {
            await this.#writeHtmlNode(content);
        }
    }

    async #writeHtmlNode(node: HtmlNode): Promise<void> {
        if (typeof node === "string") {
            this.#writer.text(node);
        } else {
            await this.#writeHtmlElem(node);
        }
    }

    async #writeHtmlElem(elem: HtmlElem): Promise<void> {
        const { name, attr, content } = elem;
        const end = this.#writer.start(name, attr);
        if (content instanceof FlowContent) {
            await this.visitFlowContent(content);
        } else if (content) {
            await this.#writeHtmlContent(content);
        }
        end();
    }
}

interface CurrentLink {
    interaction: Interaction;
    end: EndScopeFunc;
}

interface ListStackEntry {
    endItem: EndScopeFunc;
    endList: EndScopeFunc;
    marker: ListMarkerKind;
}

const makeDefaultElementIdGenerator = () => {
    const counterByPrefix = new Map<string, number>();
    return (prefix: string) => {
        const next = 1 + (counterByPrefix.get(prefix) || 0);
        counterByPrefix.set(prefix, next);
        return `${prefix}-${next}`;
    };
};

const HELLIP = "…";
