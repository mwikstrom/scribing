import { Equatable } from "paratype";
import { js2xml, Element as XmlElem, Attributes as XmlAttr } from "xml-js";
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
import { ParagraphTheme } from "../styles/ParagraphTheme";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { FlowCursor } from "../selection/FlowCursor";
import { Interaction } from "../interaction/Interaction";
import { OpenUrl } from "../interaction/OpenUrl";
import { RunScript } from "../interaction/RunScript";
import { serializeMessage } from "./serialize-message";

export function serializeFlowContentToXml(
    content: FlowContent,
    theme: FlowTheme = DefaultFlowTheme.instance
): string {
    const serializer = new Serializer(theme);
    serializer.visitFlowContent(content);
    const root = serializer.getResult();
    return js2xml(root, { spaces: 4 });
}

class Serializer extends FlowNodeVisitor {
    readonly #themeStack: FlowTheme[] = [];
    readonly #bodyStack: XmlElem[] = [{type: "element", name: "body"}];
    readonly #scripts = new Map<Script, XmlElem>();
    readonly #imageSources = new Map<ImageSource, XmlElem>();
    readonly #textStyles = new Map<TextStyle, XmlElem>();
    readonly #paraStyles = new Map<ParagraphStyle, XmlElem>();
    readonly #boxStyles = new Map<BoxStyle, XmlElem>();
    readonly #tableStyles = new Map<TableStyle, XmlElem>();
    #paraTheme: ParagraphTheme;

    constructor(theme: FlowTheme) {
        super();
        this.#themeStack.push(theme);
        this.#paraTheme = theme.getParagraphTheme("normal");
    }
    
    getResult(): XmlElem {
        const root: XmlElem = {
            type: "element",
            name: "flowdoc",
            attributes: {
                xmlns: "https://cdn.dforigo.com/schemas/scribing-flowdoc-v1"
            },
            elements: [
                this.#bodyStack[0],
                ...this.#scripts.values(),
                ...this.#imageSources.values(),
                ...this.#textStyles.values(),
                ...this.#paraStyles.values(),
                ...this.#boxStyles.values(),
                ...this.#tableStyles.values(),
            ],
        };
        return {elements: [root]};
    }

    visitFlowContent(content: FlowContent): FlowContent {
        const flowTheme = this.#getCurrentFlowTheme();
        let resetPara = true;
        
        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (resetPara) {
                const endOfPara = cursor.findNodeForward(ParagraphBreak.classType.test);
                const paraBreak = endOfPara?.node;
                if (paraBreak instanceof ParagraphBreak) {
                    this.#paraTheme = flowTheme.getParagraphTheme(paraBreak.style.variant ?? "normal");
                    this.#appendElemStart("p", {
                        style: this.#getParaStyleId(paraBreak.style),
                    });
                } else {
                    this.#paraTheme = flowTheme.getParagraphTheme("normal");
                }
                resetPara = false;
            }
            
            const { node } = cursor;
            if (ParagraphBreak.classType.test(node)) {
                resetPara = true;
                this.#appendElemEnd();
            } else if (node) {
                this.visitNode(node);
            }
        }

        return content;
    }

    visitDynamicText(node: DynamicText): FlowNode {
        const { expression, style } = node;
        this.#appendElem("dynamic", {
            expression: this.#getScriptId(expression),
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitEmptyMarkup(node: EmptyMarkup): FlowNode {
        const { tag, style, attr } = node;
        this.#appendElem("markup", {
            tag,
            style: this.#getTextStyleId(style),
        }, serializeMarkupAttr(attr));
        return node;
    }

    visitEndMarkup(node: EndMarkup): FlowNode {
        const { tag, style } = node;
        this.#appendElem("end-markup", {
            tag,
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitBox(node: FlowBox): FlowNode {
        const { style, content } = node;
        this.#appendElemStart("box", {
            style: this.#getBoxStyleId(style),
        });
        const boxTheme = this.#getCurrentFlowTheme().getBoxTheme(style);
        this.#themeStack.push(boxTheme);
        this.visitFlowContent(content);
        this.#themeStack.pop();
        this.#appendElemEnd();
        return node;
    }

    visitIcon(node: FlowIcon): FlowNode {
        const { data, style } = node;
        this.#appendElem("icon", {
            data,
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitImage(node: FlowImage): FlowNode {
        const { source, style } = node;
        this.#appendElem("icon", {
            source: this.#getImageSourceId(source),
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitTable(node: FlowTable): FlowNode {
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
        this.visitTableContent(content);
        this.#appendElemEnd();
        return node;
    }

    visitTableContent(content: FlowTableContent): FlowTableContent {
        const data = content.toData();
        for (const [key, { colSpan: colspan, rowSpan: rowspan, content: nested}] of data) {
            this.#appendElemStart("cell", {
                key,
                colspan,
                rowspan,
            });
            this.visitFlowContent(nested);
            this.#appendElemEnd();
        }
        return content;
    }

    visitLineBreak(node: LineBreak): FlowNode {
        const { style } = node;
        this.#appendElem("br", {
            style: this.#getTextStyleId(style),
        });
        return node;
    }

    visitStartMarkup(node: StartMarkup): FlowNode {
        const { tag, style, attr } = node;
        this.#appendElem("start-markup", {
            tag,
            style: this.#getTextStyleId(style),
        }, serializeMarkupAttr(attr));
        return node;
    }

    visitTextRun(node: TextRun): FlowNode {
        const { style, text } = node;
        const { translate } = this.#paraTheme.getAmbientTextStyle().merge(style);
        const tagName = translate === false ? "c" : "t";
        this.#appendElem(tagName, {
            style: this.#getTextStyleId(style),
        }, text);
        return node;
    }

    #getCurrentFlowTheme(): FlowTheme {
        return this.#themeStack[this.#themeStack.length - 1];
    }

    #appendElem(name: string, attr: XmlAttr, children?: string | XmlElem[]): void {
        this.#appendElemStart(name, attr);
        if (typeof children === "string") {
            this.#appendLeaf({ type: "text", text: children });
        } else if (children) {
            children.forEach(child => this.#appendLeaf(child));
        }
        this.#appendElemEnd();
    }

    #appendElemStart(name: string, attributes: XmlAttr): void {
        this.#bodyStack.push({type: "element", name, attributes});
    }

    #appendElemEnd(): void {
        const child = this.#bodyStack.pop();
        if (child && this.#bodyStack.length > 0) {
            const parent = this.#bodyStack[this.#bodyStack.length - 1];
            if (!parent.elements) {
                parent.elements = [child];
            } else {
                parent.elements.push(child);
            }
        }
    }

    #appendLeaf(elem: XmlElem): void {
        const leaf = this.#bodyStack[this.#bodyStack.length - 1];
        if (!leaf.elements) {
            leaf.elements = [elem];
        } else {
            leaf.elements.push(elem);
        }
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

const serializeMarkupAttr = (attr: ReadonlyMap<string, string>): XmlElem[] => Array.from(attr).map(([key, value]) => ({
    type: "element",
    name: "attr",
    attributes: { key, value },
}));

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
    const { inline } = style;
    return {
        type: "element",
        name: "table-style",
        attributes: {
            id,
            inline: serializeBooleanAttr(inline),
        },
    };
};

const serializeBooleanAttr = (value: boolean | undefined): string | undefined => {
    if (typeof value === "boolean") {
        return String(value);
    }
};
