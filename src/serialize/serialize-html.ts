import { js2xml } from "xml-js";
import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
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
    const { theme = DefaultFlowTheme.instance } = options;
    const serializer = new HtmlSerializer(theme);
    serializer.visitFlowContent(content);
    const root = serializer.getResult();
    return js2xml(root, {
        spaces: 4,
        attributeValueFn: val => val.replace(
            /\s/g, 
            ws => ws === " " ? ws : `&#x${ws.charCodeAt(0).toString(16).padStart(4, "0")};`
        ),
    });
}
