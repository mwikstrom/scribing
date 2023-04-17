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
import { ParagraphBreak } from "../nodes/ParagraphBreak";
import { FlowCursor } from "../selection/FlowCursor";
import { ParagraphStyle } from "../styles/ParagraphStyle";
import type {
    FlowContentHtmlClassKey,
    FlowContentHtmlOptions,
    HtmlContent,
    HtmlElem,
    HtmlNode
} from "./serialize-html";
import { Attributes } from "xml-js";
import { InlineNode } from "../nodes/InlineNode";
import { Interaction } from "../interaction/Interaction";
import { OpenUrl } from "../interaction/OpenUrl";
import { RunScript } from "../interaction/RunScript";

/** @internal */
export class HtmlSerializer extends AsyncFlowNodeVisitor {
    readonly #replacements: WeakMap<EmptyMarkup, HtmlContent>;
    readonly #classes: Partial<Record<FlowContentHtmlClassKey, string>>;
    readonly #theme: ThemeManager;
    readonly #getElementId: Exclude<FlowContentHtmlOptions["getElementId"], undefined>;
    readonly #getLinkHref: Exclude<FlowContentHtmlOptions["getLinkHref"], undefined>;
    readonly #registerClickHandler: Exclude<FlowContentHtmlOptions["registerClickHandler"], undefined>;
    readonly #registerDynamicText: Exclude<FlowContentHtmlOptions["registerDynamicText"], undefined>;
    readonly #writer = new XmlWriter();
    readonly #endArticle: EndScopeFunc;

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
        this.#registerClickHandler = options.registerClickHandler || (() => void 0);
        this.#registerDynamicText = options.registerDynamicText || (() => void 0);
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
        
        for (let cursor: FlowCursor | null = content.peek(0); cursor; cursor = cursor.moveToStartOfNextNode()) {
            if (!endPara) {
                const paraBreak = cursor.findNodeForward(ParagraphBreak.classType.test)?.node;
                if (paraBreak instanceof ParagraphBreak) {
                    endPara = this.#startPara(paraBreak.style);
                } else {
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

    #getClassName(key: FlowContentHtmlClassKey): string {
        return this.#classes[key] || key;
    }

    #startPara(style: ParagraphStyle): EndScopeFunc {
        const { variant = "normal" } = style;
        let endElem: EndScopeFunc;

        if (/^h[1-6]$/.test(variant)) {
            endElem = this.#writer.start(variant);
        } else if (variant === "title" || variant === "subtitle" || variant === "preamble") {
            endElem = this.#writer.start("p", { class: this.#getClassName(variant) });
        } else if (variant === "code") {
            endElem = this.#writer.start("p", { class: this.#getClassName("codeBlock") });
        } else {
            endElem = this.#writer.start("p");
        }

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
            this.#registerClickHandler(id, interaction.script);
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

interface CurrentLink {
    interaction: Interaction;
    end: EndScopeFunc;
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
