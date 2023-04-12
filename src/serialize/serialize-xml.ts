import { FlowContent } from "../structure/FlowContent";
import { FlowTheme } from "../styles/FlowTheme";
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
    theme?: FlowTheme
): string {
    const serializer = new XmlSerializer(theme);
    serializer.visitFlowContent(content);
    return serializer.getResult();
}
