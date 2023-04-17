import { MarkupHandler, processMarkup } from "../markup/process-markup";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { FlowContent } from "../structure/FlowContent";
import { FlowColor } from "../styles/FlowColor";
import { FlowTheme } from "../styles/FlowTheme";
import { FontFamily } from "../styles/TextStyle";
import { HtmlSerializer } from "./HtmlSerializer";

/** @public */
export interface FlowContentHtmlOptions {
    theme?: FlowTheme;
    classes?: Partial<Record<FlowContentHtmlClassKey, string>>;
    rewriteMarkup?: MarkupHandler<HtmlContent>;
}

/** @public */
export type FlowContentHtmlClassKey =
    | "text"
    | "bold"
    | "notBold"
    | "italic"
    | "notItalic"
    | "sub"
    | "super"
    | "normalBaseline"
    | "underline"
    | "notUnderline"
    | "strike"
    | "notStrike"
    | `${FontFamily}Font`
    | `${FlowColor}Color`;

/** @public */
export type HtmlContent = HtmlNode | HtmlNode[];

/** @public */
export type HtmlNode = string | HtmlElem;

/** @public */
export interface HtmlElem {
    name: string;
    attr?: Record<string, string>;
    content?: FlowContent | HtmlContent | null;
}

/**
 * Serializes the specified flow content to an HTML string
 * @param content - The flow content that shall be serialized
 * @param options - Optional. HTML serialization options.
 * @returns A promise that is resolved with the serialized HTML string
 * @public
 */
export async function serializeFlowContentToHtml(
    content: FlowContent,
    options: FlowContentHtmlOptions = {}
): Promise<string> {
    const { theme, classes, rewriteMarkup } = options;
    const replacements = new WeakMap<EmptyMarkup, HtmlContent>();
    
    if (rewriteMarkup) {
        content = await processMarkup(
            content,
            rewriteMarkup,
            (flow, html) => replacements.set(flow, html)
        );
    }

    const serializer = new HtmlSerializer(replacements, classes, theme);
    await serializer.visitFlowContent(content);
    return serializer.getResult();
}
