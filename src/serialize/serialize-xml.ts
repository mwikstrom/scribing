import { js2xml } from "xml-js";
import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
import { DefaultFlowTheme } from "../styles/DefaultFlowTheme";
import { XmlSerializer } from "./XmlSerializer";

/**
 * Serializes the specified flow content to an XML string
 * @param content - The flow content that shall be serialized
 * @param theme - Optional. Theme of the content that shall be serialized
 * @returns The serialized XML string
 * @public
 */
export function serializeFlowContentToXml(
    content: FlowContent,
    theme: FlowTheme = DefaultFlowTheme.instance
): string {
    const serializer = new XmlSerializer(theme);
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
