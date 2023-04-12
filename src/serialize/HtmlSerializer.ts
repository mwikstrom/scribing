import { DynamicText } from "../nodes/DynamicText";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { EndMarkup } from "../nodes/EndMarkup";
import { FlowBox } from "../nodes/FlowBox";
import { FlowIcon } from "../nodes/FlowIcon";
import { FlowImage } from "../nodes/FlowImage";
import { FlowNode } from "../nodes/FlowNode";
import { FlowTable } from "../nodes/FlowTable";
import { LineBreak } from "../nodes/LineBreak";
import { StartMarkup } from "../nodes/StartMarkup";
import { TextRun } from "../nodes/TextRun";
import { FlowContent } from "../structure/FlowContent";
import { FlowTableContent } from "../structure/FlowTableContent";
import { AsyncFlowNodeVisitor } from "../structure/AsyncFlowNodeVisitor";
import type { FlowContentHtmlOptions } from "./serialize-html";
import { XmlWriter } from "./XmlWriter";
import { ThemeManager } from "./ThemeManager";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { FlowCursor } from "../selection/FlowCursor";

/** @internal */
export class HtmlSerializer extends AsyncFlowNodeVisitor {
    readonly #theme: ThemeManager;
    readonly #writer = new XmlWriter();

    constructor(options: FlowContentHtmlOptions) {
        const { theme } = options;
        super();
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
        /*
        let resetPara = true;
        
        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (resetPara) {
                const endOfPara = cursor.findNodeForward(ParagraphBreak.classType.test)?.node;
                if (endOfPara instanceof ParagraphBreak) {
                    this.#theme.resetPara(endOfPara.style.variant);
                    this.#writer.start("p", {
                        style: this.#getParaStyleId(paraBreak.style),
                    });
                } else {
                    this.#theme.resetPara();
                }
                resetPara = false;
            }
            
            const { node } = cursor;

            if (ParagraphBreak.classType.test(node)) {
                resetPara = true;
                this.#writer.end();
            } else if (node) {
                await this.visitNode(node);
            }
        }*/

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
        /*
        const { tag, style, attr } = node;
        this.#appendElem("markup", {
            tag,
            style: this.#getTextStyleId(style),
        }, this.#serializeMarkupAttr(attr));
        */
        return node;
    }

    async visitEndMarkup(node: EndMarkup): Promise<FlowNode> {
        /*
        const { tag, style } = node;
        this.#appendElem("end-markup", {
            tag,
            style: this.#getTextStyleId(style),
        });
        */
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

    async visitStartMarkup(node: StartMarkup): Promise<FlowNode> {
        /*
        const { tag, style, attr } = node;
        this.#appendElem("start-markup", {
            tag,
            style: this.#getTextStyleId(style),
        }, this.#serializeMarkupAttr(attr));
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
}
