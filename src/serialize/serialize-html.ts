import { MarkupHandler, processMarkup } from "../markup/process-markup";
import { EmptyMarkup } from "../nodes/EmptyMarkup";
import { PredefinedIcon } from "../nodes/FlowIcon";
import { FlowContent } from "../structure/FlowContent";
import { ImageSource } from "../structure/ImageSource";
import { Script } from "../structure/Script";
import { VideoSource } from "../structure/VideoSource";
import { BoxVariant } from "../styles/BoxStyle";
import { FlowColor } from "../styles/FlowColor";
import { FlowTheme } from "../styles/FlowTheme";
import { HorizontalAlignment, ReadingDirection } from "../styles/ParagraphStyle";
import { FontFamily, TextStyle } from "../styles/TextStyle";
import { HtmlSerializer } from "./HtmlSerializer";

/** @public */
export interface FlowContentHtmlOptions {
    theme?: FlowTheme;
    classes?: Partial<Record<FlowContentHtmlClassKey, string>>;
    getElementId?: (this: void, prefix: string) => string;
    getLinkHref?: (this: void, url: string) => string;
    getImageUrl?: (this: void, source: ImageSource, scale: number, usage: ImageUsage) => string | Promise<string>
    getVideoUrl?: (this: void, source: VideoSource, scale: number) => string | Promise<string>;
    registerScriptInteraction?: (this: void, elementId: string, script: Script) => void;
    registerDynamicText?: (this: void, elementId: string, expression: Script, style: TextStyle) => void;
    registerDataSource?: (this: void, elementId: string, script: Script) => void;
    rewriteMarkup?: MarkupHandler<HtmlContent>;
}

/** @public */
export type ImageUsage = StandardImageUsage | PosterImageUsage;

/** @public */
export interface AbstractImageUsage<T extends string> {
    mode: T;
}

/** @public */
export type StandardImageUsage = AbstractImageUsage<"standard">;

/** @public */
export interface PosterImageUsage extends AbstractImageUsage<"poster"> {
    originalVideoUrl: string;
    videoUrl: string;
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
    | `${FlowColor}Color`
    | "title"
    | "subtitle"
    | "preamble"
    | "codeBlock"
    | `${HorizontalAlignment}Align`
    | `${ReadingDirection}Direction`
    | "dashListMarker"
    | "box"
    | `${BoxVariant}Box`
    | "inlineBox"
    | "icon"
    | `${PredefinedIcon}Icon`
    | "inlineTable"
    ;

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
    const { rewriteMarkup, ...otherOptions } = options;
    const replacements = new WeakMap<EmptyMarkup, HtmlContent>();
    
    const processNestedMarkup = async (nested: FlowContent) => {
        if (rewriteMarkup) {
            return await processMarkup(
                nested,
                rewriteMarkup,
                (flow, html) => replacements.set(flow, html)
            );
        } else {
            return nested;
        }
    };   

    const serializer = new HtmlSerializer(replacements, otherOptions, processNestedMarkup);
    const rewritten = await processNestedMarkup(content);
    await serializer.visitFlowContent(rewritten);
    return serializer.getResult();
}
