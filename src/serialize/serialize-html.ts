import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { HtmlSerializer } from "./HtmlSerializer";

/**
 * @public
 */
export interface FlowContentHtmlOptions {
    theme?: FlowTheme;
}

/**
 * Serializes the specified flow content to an HTML string
 * @param content - The flow content that shall be serialized
 * @param options - Optional. HTML serialization options.
 * @returns A promise that is resolved with the serialized HTML string
 * @public
 */
export function serializeFlowContentToHtml(
    content: FlowContent,
    options: FlowContentHtmlOptions = {}
): string {
    const serializer = new HtmlSerializer(options);
    serializer.visitFlowContent(content);
    return serializer.getResult();
}
