import { MarkupHandler, processMarkup } from "../markup/process-markup";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { FlowNode } from "../nodes/FlowNode";
import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { HtmlSerializer } from "./HtmlSerializer";

/** @public */
export interface FlowContentHtmlOptions {
    theme?: FlowTheme;
    rewriteMarkup?: MarkupHandler<HtmlContent>;
}

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
    const { theme, rewriteMarkup } = options;
    const replacements = new WeakMap<EmptyMarkup, HtmlContent>();
    
    if (rewriteMarkup) {
        content = await processMarkup(
            content,
            rewriteMarkup,
            (flow, html) => replacements.set(flow, html)
        );
    }

    const serializer = new HtmlSerializer(replacements, theme);
    await serializer.visitFlowContent(content);
    return serializer.getResult();
}
