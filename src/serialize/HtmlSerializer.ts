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
import { XmlWriter } from "./XmlWriter";
import { ThemeManager } from "./ThemeManager";
import { FlowTheme } from "../styles/FlowTheme";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { FlowCursor } from "../selection/FlowCursor";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import type { HtmlContent, HtmlElem, HtmlNode } from "./serialize-html";

/** @internal */
export class HtmlSerializer extends AsyncFlowNodeVisitor {
    readonly #replacements: WeakMap<EmptyMarkup, HtmlContent>;
    readonly #theme: ThemeManager;
    readonly #writer = new XmlWriter();

    constructor(replacements: WeakMap<EmptyMarkup, HtmlContent>, theme?: FlowTheme) {
        super();
        this.#replacements = replacements;
        this.#theme = new ThemeManager(theme);
        this.#writer.start("article");
    }
    
    getResult(): string {
        this.#writer.end(); // article;
        const result = this.#writer.toString();
        this.#writer.reset();
        return result;
    }

    async visitFlowContent(content: FlowContent): Promise<FlowContent> {
        let enterNextPara = true;
        
        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (enterNextPara) {
                const endOfPara = cursor.findNodeForward(ParagraphBreak.classType.test)?.node;
                if (endOfPara instanceof ParagraphBreak) {
                    this.#theme.enterPara(endOfPara.style.variant);
                    // this.#startPara(endOfPara.style);
                }
                enterNextPara = false;
            }
            
            const { node } = cursor;

            if (node instanceof ParagraphBreak) {
                enterNextPara = true;
                this.#theme.leave();
                // this.#endPara(node.style);
            } else if (node) {
                await this.visitNode(node);
            }
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

    async visitTableContent(content: FlowTableContent, headingRowCount?: number): Promise<FlowTableContent> {
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
        /*
        const { style, text } = node;
        const { translate } = this.#paraTheme.getAmbientTextStyle().merge(style);
        const tagName = translate === false ? "c" : "t";
        this.#appendElem(tagName, {
            style: this.#getTextStyleId(style),
        }, text);
        */
        return node;
    }

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
        this.#writer.start(name, attr);
        if (content instanceof FlowContent) {
            this.visitFlowContent(content);
        } else if (content) {
            this.#writeHtmlContent(content);
        }
        this.#writer.end();
    }
}
