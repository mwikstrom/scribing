import { DynamicText } from "../nodes/DynamicText";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { FlowBox } from "../nodes/FlowBox";
import { FlowIcon } from "../nodes/FlowIcon";
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
import { FlowTheme } from "../styles/FlowTheme";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { FlowCursor } from "../selection/FlowCursor";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import type { FlowContentHtmlClassKey, HtmlContent, HtmlElem, HtmlNode } from "./serialize-html";
import { Attributes } from "xml-js";

/** @internal */
export class HtmlSerializer extends AsyncFlowNodeVisitor {
    readonly #replacements: WeakMap<EmptyMarkup, HtmlContent>;
    readonly #classes: Partial<Record<FlowContentHtmlClassKey, string>>;
    readonly #theme: ThemeManager;
    readonly #writer = new XmlWriter();
    readonly #endArticle: EndScopeFunc;

    constructor(
        replacements: WeakMap<EmptyMarkup, HtmlContent>,
        classes?: Partial<Record<FlowContentHtmlClassKey, string>>,
        theme?: FlowTheme
    ) {
        super();
        this.#replacements = replacements;
        this.#classes = classes || {};
        this.#theme = new ThemeManager(theme);
        this.#endArticle = this.#writer.start("article");
    }
    
    getResult(): string {
        this.#endArticle();
        const result = this.#writer.toString();
        this.#writer.reset();
        return result;
    }

    async visitFlowContent(content: FlowContent): Promise<FlowContent> {
        let endFunc: EndScopeFunc | undefined;
        
        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (!endFunc) {
                const endOfPara = cursor.findNodeForward(ParagraphBreak.classType.test)?.node;
                if (endOfPara instanceof ParagraphBreak) {
                    endFunc = this.#startPara(endOfPara.style);
                } else {
                    endFunc = this.#startPhrasingContent();
                }
            }
            
            const { node } = cursor;

            if (node instanceof ParagraphBreak && endFunc) {
                endFunc();
                endFunc = undefined;
            } else if (node) {
                await this.visitNode(node);
            }
        }

        if (endFunc) {
            endFunc();
        }

        return content;
    }

    async visitDynamicText(node: DynamicText): Promise<FlowNode> {
        /*
        const { expression, style } = node;
        this.#appendElem("dynamic", {
            expression: this.#getScriptId(expression),
            style: this.#getTextStyleId(style),
        });
        */
        return node;
    }

    async visitEmptyMarkup(node: EmptyMarkup): Promise<FlowNode> {
        const html = this.#replacements.get(node);
        if (html) {
            this.#writeHtmlContent(html);
        }
        return node;
    }

    async visitBox(node: FlowBox): Promise<FlowNode> {
        /*
        const { style, content } = node;
        this.#appendElemStart("box", {
            style: this.#getBoxStyleId(style),
        });
        const boxTheme = this.#getCurrentFlowTheme().getBoxTheme(style);
        this.#themeStack.push(boxTheme);
        await this.visitFlowContent(content);
        this.#themeStack.pop();
        this.#appendElemEnd();
        */
        return node;
    }

    async visitIcon(node: FlowIcon): Promise<FlowNode> {
        /*
        const { data, style } = node;
        this.#appendElem("icon", {
            data,
            style: this.#getTextStyleId(style),
        });
        */
        return node;
    }

    async visitImage(node: FlowImage): Promise<FlowNode> {
        /*
        const { source, style, scale } = node;
        this.#appendElem("image", {
            source: this.#getImageSourceId(source),
            style: this.#getTextStyleId(style),
            scale: scale !== 1 ? scale : undefined,
        });
        */
        return node;
    }

    async visitTable(node: FlowTable): Promise<FlowNode> {
        /*
        const { columns, style, content } = node;
        this.#appendElemStart("table", {
            style: this.#getTableStyleId(style),
        });
        for (const [key, {width}] of columns) {
            this.#appendElem("col", {
                key,
                width,
            });
        }
        await this.visitTableContent(content, style.head);
        this.#appendElemEnd();
        */
        return node;
    }

    async visitTableContent(content: FlowTableContent): Promise<FlowTableContent> {
        /*
        const data = content.toData();
        for (const [key, { colSpan, rowSpan, content: nested}] of data) {
            this.#writer.start("cell", {
                key,
                colspan: colSpan === 1 ? undefined : colSpan,
                rowspan: rowSpan === 1 ? undefined : rowSpan,
            });
            this.#theme.enterTableCell(key, headingRowCount);
            this.visitFlowContent(nested);
            this.#theme.leave();
            this.#writer.end();
        }
        */
        return content;
    }

    async visitLineBreak(node: LineBreak): Promise<FlowNode> {
        /*
        const { style } = node;
        this.#appendElem("br", {
            style: this.#getTextStyleId(style),
        });
        */
        return node;
    }

    async visitTextRun(node: TextRun): Promise<FlowNode> {
        const { text, style } = node;
        const ambient = this.#theme.para.getAmbientTextStyle();
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

    #getClassName(key: FlowContentHtmlClassKey): string {
        return this.#classes[key] || key;
    }

    #startPara(style: ParagraphStyle): EndScopeFunc {
        const { variant = "normal" } = style;
        let endElem: EndScopeFunc;

        if (/^h[1-6]$/.test(variant)) {
            endElem = this.#writer.start(variant);
        } else {
            endElem = this.#writer.start("p");
        }

        const endTheme = this.#theme.startPara(variant);
        const leavePhrasingContent = this.#startPhrasingContent();        

        return () => {
            leavePhrasingContent();
            endTheme();
            endElem();
        };
    }

    #startPhrasingContent(): EndScopeFunc {
        // const ambient = this.#theme.para.getAmbientTextStyle();
        // const manager = new HtmlTextStyleManager(this.#writer, ambient);
        // this.#phrasingContentStack.push(manager);
        return () => {
            // const popped = this.#phrasingContentStack.pop();
            // if (popped === manager) {
            //     popped.dispose();
            // } else {
            //     throw new Error("Closing unexpected phrasing content");
            // }
        };
    }

    /*
    #applyTextStyle(style: TextStyle): void {
        const { length: stackLength } = this.#phrasingContentStack;
        if (stackLength > 0) {
            this.#phrasingContentStack[stackLength - 1].apply(style);
        }
    }
    */

    #writeHtmlContent(content: HtmlContent): void {
        if (Array.isArray(content)) {
            content.forEach(node => this.#writeHtmlNode(node));
        } else {
            this.#writeHtmlNode(content);
        }
    }

    #writeHtmlNode(node: HtmlNode): void {
        if (typeof node === "string") {
            this.#writer.text(node);
        } else {
            this.#writeHtmlElem(node);
        }
    }

    #writeHtmlElem(elem: HtmlElem): void {
        const { name, attr, content } = elem;
        const end = this.#writer.start(name, attr);
        if (content instanceof FlowContent) {
            this.visitFlowContent(content);
        } else if (content) {
            this.#writeHtmlContent(content);
        }
        end();
    }
}
