import { Equatable } from "paratype";
import { Element as XmlElem } from "xml-js";
import { DynamicText } from "../nodes/DynamicText";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { EndMarkup } from "../nodes/EndMarkup";
import { FlowBox } from "../nodes/FlowBox";
import { FlowIcon } from "../nodes/FlowIcon";
import { FlowImage } from "../nodes/FlowImage";
import { FlowNode } from "../nodes/FlowNode";
import { FlowTable } from "../nodes/FlowTable";
import { LineBreak } from "../nodes/LineBreak";
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { StartMarkup } from "../nodes/StartMarkup";
import { TextRun } from "../nodes/TextRun";
import { Script } from "../structure/Script";
import { FlowContent } from "../structure/FlowContent";
import { FlowNodeVisitor } from "../structure/FlowNodeVisitor";
import { FlowTableContent } from "../structure/FlowTableContent";
import { ImageSource } from "../structure/ImageSource";
import { BoxStyle } from "../styles/BoxStyle";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import { TableStyle } from "../styles/TableStyle";
import { TextStyle } from "../styles/TextStyle";
import { FlowTheme } from "../styles/FlowTheme";
import { FlowCursor } from "../selection/FlowCursor";
import { Interaction } from "../interaction/Interaction";
import { OpenUrl } from "../interaction/OpenUrl";
import { RunScript } from "../interaction/RunScript";
import { serializeMessage } from "../internal/serialize-message-format";
import { AttrValue } from "../nodes/AttrValue";
import { XmlWriter } from "./XmlWriter";
import { ThemeManager } from "./ThemeManager";

/** @internal */
export class XmlSerializer extends FlowNodeVisitor {
    readonly #theme: ThemeManager;
    readonly #writer = new XmlWriter();
    readonly #scripts = new Map<Script, XmlElem>();
    readonly #imageSources = new Map<ImageSource, XmlElem>();
    readonly #textStyles = new Map<TextStyle, XmlElem>();
    readonly #paraStyles = new Map<ParagraphStyle, XmlElem>();
    readonly #boxStyles = new Map<BoxStyle, XmlElem>();
    readonly #tableStyles = new Map<TableStyle, XmlElem>();

    constructor(theme?: FlowTheme) {
        super();
        this.#theme = new ThemeManager(theme);
        this.#writer.start("flowdoc", { xmlns: "https://cdn.dforigo.com/schemas/scribing-flowdoc-v1" });
        this.#writer.start("body");
    }
        
    getResult(): string {
        this.#writer.end(); // body
        this.#writer.append(...this.#scripts.values());
        this.#writer.append(...this.#imageSources.values());
        this.#writer.append(...this.#textStyles.values());
        this.#writer.append(...this.#paraStyles.values());
        this.#writer.append(...this.#boxStyles.values());
        this.#writer.append(...this.#tableStyles.values());
        this.#writer.end(); // flowdoc
        const result = this.#writer.toString();
        this.#writer.reset();
        return result;
    }

    visitFlowContent(content: FlowContent): FlowContent {
        let enterNextPara = true;
        
        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (enterNextPara) {
                const endOfPara = cursor.findNodeForward(ParagraphBreak.classType.test);
                const paraBreak = endOfPara?.node;
                if (paraBreak instanceof ParagraphBreak) {
                    this.#theme.enterPara(paraBreak.style.variant);
                    this.#writer.start("p", {
                        style: this.#getParaStyleId(paraBreak.style),
                    });
                }
                enterNextPara = false;
            }
            
            const { node } = cursor;
            if (node instanceof ParagraphBreak) {
                enterNextPara = true;
                this.#theme.leave();
                this.#writer.end();
            } else if (node) {
                this.visitNode(node);
            }
        }

        return content;
    }

    visitDynamicText(node: DynamicText): FlowNode {
        const { expression, style } = node;
        this.#writer.elem("dynamic", {
            expression: this.#getScriptId(expression),
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitEmptyMarkup(node: EmptyMarkup): FlowNode {
        const { tag, style, attr } = node;
        this.#writer.elem("markup", {
            tag,
            style: this.#getTextStyleId(style),
        }, this.#serializeMarkupAttr(attr));
        return node;
    }

    visitEndMarkup(node: EndMarkup): FlowNode {
        const { tag, style } = node;
        this.#writer.elem("end-markup", {
            tag,
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitBox(node: FlowBox): FlowNode {
        const { style, content } = node;
        this.#writer.start("box", {
            style: this.#getBoxStyleId(style),
        });
        this.#theme.enterBox(style);
        this.visitFlowContent(content);
        this.#theme.leave();
        this.#writer.end();
        return node;
    }

    visitIcon(node: FlowIcon): FlowNode {
        const { data, style } = node;
        this.#writer.elem("icon", {
            data,
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitImage(node: FlowImage): FlowNode {
        const { source, style, scale } = node;
        this.#writer.elem("image", {
            source: this.#getImageSourceId(source),
            style: this.#getTextStyleId(style),
            scale: scale !== 1 ? scale : undefined,
        });
        return node;
    }

    visitTable(node: FlowTable): FlowNode {
        const { columns, style, content } = node;
        this.#writer.start("table", {
            style: this.#getTableStyleId(style),
        });
        for (const [key, {width}] of columns) {
            this.#writer.elem("col", {
                key,
                width,
            });
        }
        this.visitTableContent(content, style.head);
        this.#writer.end();
        return node;
    }

    visitTableContent(content: FlowTableContent, headingRowCount?: number): FlowTableContent {
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
        return content;
    }

    visitLineBreak(node: LineBreak): FlowNode {
        const { style } = node;
        this.#writer.elem("br", {
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitStartMarkup(node: StartMarkup): FlowNode {
        const { tag, style, attr } = node;
        this.#writer.elem("start-markup", {
            tag,
            style: this.#getTextStyleId(style),
        }, this.#serializeMarkupAttr(attr));
        return node;
    }

    visitTextRun(node: TextRun): FlowNode {
        const { style, text } = node;
        const { translate } = this.#theme.para.getAmbientTextStyle().merge(style);
        const tagName = translate === false ? "c" : "t";
        this.#writer.elem(tagName, {
            style: this.#getTextStyleId(style),
        }, text);
        return node;
    }

    #getScriptId(script: Script | null | undefined): string | undefined {
        if (script) {
            return getAllocatedId("script", this.#scripts, script, serializeScript);
        }
    }

    #getImageSourceId(source: ImageSource): string {
        return getAllocatedId("image", this.#imageSources, source, serializeImageSource);
    }

    #getParaStyleId(style: ParagraphStyle): string | undefined {
        if (!style.isEmpty) {
            return getAllocatedId("para", this.#paraStyles, style, serializeParaStyle);
        }
    }

    #getTextStyleId(style: TextStyle): string | undefined {
        if (!style.isEmpty) {
            return getAllocatedId("text", this.#textStyles, style, (...args) => this.#serializeTextStyle(...args));
        }        
    }

    #getBoxStyleId(style: BoxStyle): string | undefined {
        if (!style.isEmpty) {
            return getAllocatedId("box", this.#boxStyles, style, (...args) => this.#serializeBoxStyle(...args));
        }        
    }

    #getTableStyleId(style: TableStyle): string | undefined {
        if (!style.isEmpty) {
            return getAllocatedId("table", this.#tableStyles, style, serializeTableStyle);
        }
    }

    #serializeTextStyle(id: string, style: TextStyle): XmlElem {
        const {
            bold,
            italic,
            underline,
            strike,
            baseline,
            fontFamily,
            fontSize,
            color,
            spellcheck,
            translate,
            lang,
            link,
        } = style;
        let elements: XmlElem[] | undefined;
        if (link) {
            elements = [
                {
                    type: "element",
                    name: "link",
                    elements: [
                        this.#serializeInteraction(link),
                    ],
                },
            ];
        }
        return {
            type: "element",
            name: "text-style",
            attributes: {
                id,
                bold: serializeBooleanAttr(bold),
                italic: serializeBooleanAttr(italic),
                underline: serializeBooleanAttr(underline),
                strike: serializeBooleanAttr(strike),
                baseline,
                "font-family": fontFamily,
                "font-size": fontSize,
                color,
                spellcheck: serializeBooleanAttr(spellcheck),
                translate: serializeBooleanAttr(translate),
                lang,
            },
            elements,
        };
    }

    #serializeBoxStyle(id: string, style: BoxStyle): XmlElem {
        const { variant, color, inline, source, interaction } = style;
        let elements: XmlElem[] | undefined;
        if (interaction) {
            elements = [
                {
                    type: "element",
                    name: "interaction",
                    elements: [
                        this.#serializeInteraction(interaction),
                    ],
                },
            ];
        }
        return {
            type: "element",
            name: "box-style",
            attributes: {
                id,
                variant,
                color,
                inline: serializeBooleanAttr(inline),
                source: this.#getScriptId(source),
            },
            elements,
        };
    }

    #serializeInteraction(interaction: Interaction): XmlElem {
        if (interaction instanceof OpenUrl) {
            return {
                type: "element",
                name: "open-url",
                attributes: {
                    href: interaction.url,
                },
            };
        } else if (interaction instanceof RunScript) {
            return {
                type: "element",
                name: "run-script",
                attributes: {
                    ref: this.#getScriptId(interaction.script),
                },
            };
        } else {
            throw new Error(`Don't know how to serialize interaction: ${JSON.stringify(interaction.toJsonValue())}`);
        }
    }

    #serializeMarkupAttr = (
        attr: ReadonlyMap<string, AttrValue>
    ): XmlElem[] => Array.from(attr).map(([key, value]) => {
        if (typeof value === "string") {
            return {
                type: "element",
                name: "attr",
                attributes: { key, value },
            };
        } else if (value instanceof Script) {
            const script = this.#getScriptId(value);
            return {
                type: "element",
                name: "attr",
                attributes: { key, script },
            };
        } else {
            throw new Error(`Don't know how to serialize attribute value: ${value}`);
        }
    });
}

const getAllocatedId = <T extends Equatable>(
    prefix: string,
    map: Map<T, XmlElem>,
    needle: T,
    factory: (id: string, item: T) => XmlElem,
): string => {
    let index = 1;
    let found = false;
    for (const entry of map) {
        const [item] = entry;
        if (item.equals(needle)) {
            found = true;
            break;
        } else {
            ++index;
        }        
    }
    const id = `${prefix}-${index}`;
    if (!found) {
        map.set(needle, factory(id, needle));
    }
    return id;
};

const serializeScript = (id: string, script: Script): XmlElem => {
    const { code, messages } = script;
    return {
        type: "element",
        name: "script",
        attributes: { id },
        elements: [
            {
                type: "element",
                name: "code",
                elements: [{ type: "text", text: code }],
            },
            ...Array.from(messages).map(([key, value]) => serializeMessage(key, value)),
        ],
    };
};

const serializeImageSource = (id: string, source: ImageSource): XmlElem => {
    const {
        url,
        width,
        height,
        placeholder,
        upload,
    } = source;
    return {
        type: "element",
        name: "image-source",
        attributes: {
            id,
            url,
            width,
            height,
            placeholder,
            upload,
        },
    };
};

const serializeParaStyle = (id: string, style: ParagraphStyle): XmlElem => {
    const { 
        alignment,
        direction,
        variant,
        lineSpacing,
        spaceBefore,
        spaceAfter,
        listLevel,
        listMarker,
        hideListMarker,
        listCounter,
        listCounterPrefix,
        listCounterSuffix,
    } = style;
    return {
        type: "element",
        name: "para-style",
        attributes: {
            id,
            alignment,
            direction,
            variant,
            "line-spacing": lineSpacing,
            "space-before": spaceBefore,
            "space-after": spaceAfter,
            "list-level": listLevel,
            "list-marker": listMarker,
            "hide-list-marker": serializeBooleanAttr(hideListMarker),
            "list-counter": listCounter,
            "list-counter-prefix": listCounterPrefix,
            "list-counter-suffix": listCounterSuffix,
        },
    };
};

const serializeTableStyle = (id: string, style: TableStyle): XmlElem => {
    const { inline, head } = style;
    return {
        type: "element",
        name: "table-style",
        attributes: {
            id,
            inline: serializeBooleanAttr(inline),
            head,
        },
    };
};

const serializeBooleanAttr = (value: boolean | undefined): string | undefined => {
    if (typeof value === "boolean") {
        return String(value);
    }
};
