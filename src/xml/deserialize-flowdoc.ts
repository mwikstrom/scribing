import { xml2js, Element as XmlElem } from "xml-js";
import { OpenUrl, RunScript } from "..";
import { Interaction } from "../interaction/Interaction";
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
import { FlowContent } from "../structure/FlowContent";
import { FlowTableCell } from "../structure/FlowTableCell";
import { FlowTableContent } from "../structure/FlowTableContent";
import { ImageSource } from "../structure/ImageSource";
import { Script } from "../structure/Script";
import { BoxStyle, BOX_VARIANTS } from "../styles/BoxStyle";
import { FLOW_COLORS } from "../styles/FlowColor";
import { 
    HORIZONTAL_ALIGNMENTS, 
    ListCounterAction, 
    LIST_COUNTER_ACTIONS, 
    LIST_MARKER_KINDS, 
    ParagraphStyle, 
    PARAGRAPH_VARIANTS, 
    READING_DIRECTIONS
} from "../styles/ParagraphStyle";
import { TableColumnStyle } from "../styles/TableColumnStyle";
import { TableStyle } from "../styles/TableStyle";
import { BASELINE_OFFSETS, FONT_FAMILIES, TextStyle } from "../styles/TextStyle";

interface XmlElemWithParent extends XmlElem {
    parent: XmlElem;
}

export function deserializeFlowContentFromXml(
    xml: string
): FlowContent {
    const parsed = xml2js(xml, { addParent: true }) as XmlElemWithParent;
    
    const rootElems = (parsed.elements || []).filter(e => e.type === "element");
    if (rootElems.length !== 1) {
        throw new Error("XML must have a single root element");
    }

    const root = rootElems[0];
    if (!hasFlowDocName(root, "flowdoc")) {
        throw new Error(`XML root must be named 'flowdoc' in namespace <${FLOWDOCNS}>`);
    }
    
    let content = FlowContent.empty;

    if (root.elements) {
        for (const child of root.elements) {
            if (hasFlowDocName(child, "body")) {
                content = deserializeBody(child);
            }
        }
    }

    return content;
}

const deserializeBody = (container: XmlElem): FlowContent => {
    const { elements } = container;
    const nodes: FlowNode[] = [];
    if (elements) {
        for (const child of elements) {
            if (hasFlowDocName(child, "p")) {
                nodes.push(...deserializePara(child));
            } else {            
                const node = deserializeNode(child);
                if (node) {
                    nodes.push(node);
                }
            }
        }
    }
    return FlowContent.fromData(nodes);
};

const deserializePara = (para: XmlElem): FlowNode[] => {
    const { elements } = para;
    const nodes: FlowNode[] = [];

    if (elements) {
        for (const child of elements) {
            const node = deserializeNode(child);
            if (node) {
                nodes.push(node);
            }
        }
    }

    const style = getParaStyle(para);
    nodes.push(new ParagraphBreak({ style }));

    return nodes;
};

const deserializeNode = (elem: XmlElem): FlowNode | undefined => {
    if (hasFlowDocName(elem, "t") || hasFlowDocName(elem, "c")) {
        return deserializeText(elem);
    } else if (hasFlowDocName(elem, "dynamic")) {
        return deserializeDynamic(elem);
    } else if (hasFlowDocName(elem, "markup")) {
        return deserializeMarkup(elem);
    } else if (hasFlowDocName(elem, "start-markup")) {
        return deserializeStartMarkup(elem);
    } else if (hasFlowDocName(elem, "end-markup")) {
        return deserializeEndMarkup(elem);
    } else if (hasFlowDocName(elem, "box")) {
        return deserializeBox(elem);
    } else if (hasFlowDocName(elem, "icon")) {
        return deserializeIcon(elem);
    } else if (hasFlowDocName(elem, "image")) {
        return deserializeImage(elem);
    } else if (hasFlowDocName(elem, "table")) {
        return deserializeTable(elem);
    } else if (hasFlowDocName(elem, "br")) {
        return deserializeLineBreak(elem);
    }
};

const deserializeText = (elem: XmlElem): TextRun => {
    const text = getTextFromElem(elem);
    const style = getTextStyle(elem);
    return new TextRun({ text, style });
};

const deserializeDynamic = (elem: XmlElem): DynamicText => {
    const expression = getScript(elem, getRequiredXmlAttr(elem, "expression"));
    const style = getTextStyle(elem);
    return new DynamicText({ expression, style });
};

const deserializeMarkup = (elem: XmlElem): EmptyMarkup => {
    const tag = getRequiredXmlAttr(elem, "tag");
    const style = getTextStyle(elem);
    const attr = getMarkupAttr(elem);
    return new EmptyMarkup({ tag, style, attr });
};

const getMarkupAttr = (elem: XmlElem): Map<string, string> => {
    const { elements } = elem;
    const result = new Map<string, string>();
    if (elements) {
        for (const child of elements) {
            if (hasFlowDocName(child, "attr")) {
                const key = getRequiredXmlAttr(child, "key");
                const value = getRequiredXmlAttr(child, "value");
                result.set(key, value);
            }
        }
    }
    Object.freeze(result);
    return result;
};

const deserializeStartMarkup = (elem: XmlElem): StartMarkup => {
    const tag = getRequiredXmlAttr(elem, "tag");
    const style = getTextStyle(elem);
    const attr = getMarkupAttr(elem);
    return new StartMarkup({ tag, style, attr });
};

const deserializeEndMarkup = (elem: XmlElem): EndMarkup => {
    const tag = getRequiredXmlAttr(elem, "tag");
    const style = getTextStyle(elem);
    return new EndMarkup({ tag, style });
};

const deserializeBox = (elem: XmlElem): FlowBox => {
    const style = getBoxStyle(elem);
    const content = deserializeBody(elem);
    return new FlowBox({ style, content });
};

const deserializeIcon = (elem: XmlElem): FlowIcon => {
    const data = getRequiredXmlAttr(elem, "data");
    const style = getTextStyle(elem);
    return new FlowIcon({ data, style });
};

const deserializeImage = (elem: XmlElem): FlowImage => {
    const source = getImageSource(elem, getRequiredXmlAttr(elem, "source"));
    const style = getTextStyle(elem);
    return new FlowImage({ source, style });
};

const deserializeTable = (elem: XmlElem): FlowTable => {
    const content = deserializeTableContent(elem);
    const columns = deserializeTableColumns(elem);
    const style = getTableStyle(elem);
    return new FlowTable({ content, columns, style });
};

const deserializeTableContent = (elem: XmlElem): FlowTableContent => {
    const { elements = [] } = elem;
    const cells = new Map<string, FlowTableCell>();
    let defaultContent: FlowContent | undefined;
    for (const child of elements) {
        if (hasFlowDocName(child, "cell")) {
            const key = getRequiredXmlAttr(child, "key");
            if (key === "default") {
                defaultContent = deserializeBody(child);
            } else {
                const content = deserializeBody(child);
                const colSpan = getIntegerXmlAttr(child, "colspan") || 1;
                const rowSpan = getIntegerXmlAttr(child, "rowspan") || 1;
                cells.set(key, new FlowTableCell({ content, colSpan, rowSpan }));
            }
        }
    }
    return new FlowTableContent(cells, { defaultContent, throwOnError: true });
};

const deserializeTableColumns = (elem: XmlElem): Map<string, TableColumnStyle> => {
    const { elements = [] } = elem;
    const result = new Map<string, TableColumnStyle>();
    for (const child of elements) {
        if (hasFlowDocName(child, "col")) {
            const key = getRequiredXmlAttr(child, "key");
            const width = getFloatXmlAttr(child, "width");
            result.set(key, new TableColumnStyle({ width }));
        }
    }
    return result;
};

const deserializeLineBreak = (elem: XmlElem): LineBreak => {
    const style = getTextStyle(elem);
    return new LineBreak({ style });
};

const ParaStyleCache = new WeakMap<XmlElem, Map<string, ParagraphStyle | null>>();
const getParaStyle = (elem: XmlElem): ParagraphStyle => getStyle(
    elem,
    ParagraphStyle.empty,
    ParaStyleCache,
    "para-style",
    deserializeParaStyle,
);

const BoxStyleCache = new WeakMap<XmlElem, Map<string, BoxStyle | null>>();
const getBoxStyle = (elem: XmlElem): BoxStyle => getStyle(
    elem,
    BoxStyle.empty,
    BoxStyleCache,
    "box-style",
    deserializeBoxStyle,
);

const TextStyleCache = new WeakMap<XmlElem, Map<string, TextStyle | null>>();
const getTextStyle = (elem: XmlElem): TextStyle => getStyle(
    elem,
    TextStyle.empty,
    TextStyleCache,
    "text-style",
    deserializeTextStyle,
);

const TableStyleCache = new WeakMap<XmlElem, Map<string, TableStyle | null>>();
const getTableStyle = (elem: XmlElem): TableStyle => getStyle(
    elem,
    TableStyle.empty,
    TableStyleCache,
    "table-style",
    deserializeTableStyle,
);

const ImageSourceCache = new WeakMap<XmlElem, Map<string, ImageSource | null>>();
const getImageSource = (ctx: XmlElem, id: string): ImageSource => getDefined(
    ctx,
    id,
    ImageSourceCache,
    "image-source",
    deserializeImageSource,
);

const ScriptCache = new WeakMap<XmlElem, Map<string, Script | null>>();
const getScript = (ctx: XmlElem, id: string): Script => getDefined(
    ctx,
    id,
    ScriptCache,
    "script",
    deserializeScript,
);

const getOptionalScript = (ctx: XmlElem, id: string | undefined): Script | undefined => {
    if (id) {
        return getScript(ctx, id);
    }
};

const deserializeParaStyle = (elem: XmlElem): ParagraphStyle => {
    const alignment = getXmlEnumAttr(elem, "alignment", HORIZONTAL_ALIGNMENTS);
    const direction = getXmlEnumAttr(elem, "direction", READING_DIRECTIONS);
    const variant = getXmlEnumAttr(elem, "variant", PARAGRAPH_VARIANTS);
    const lineSpacing = getIntegerXmlAttr(elem, "line-spacing");
    const spaceBefore = getIntegerXmlAttr(elem, "space-before");
    const spaceAfter = getIntegerXmlAttr(elem, "space-after");
    const listLevel = getIntegerXmlAttr(elem, "list-level");
    const listMarker = getXmlEnumAttr(elem, "list-marker", LIST_MARKER_KINDS);
    const hideListMarker = getBooleanXmlAttr(elem, "hide-list-marker");
    const rawListCounter = getXmlAttr(elem, "list-counter");
    const listCounterPrefix = getXmlAttr(elem, "list-counter-prefix");
    const listCounterSuffix = getXmlAttr(elem, "list-counter-suffix");
    let listCounter: ListCounterAction | number | undefined;

    if (rawListCounter) {
        if ((LIST_COUNTER_ACTIONS as readonly string[]).includes(rawListCounter)) {
            listCounter = rawListCounter as ListCounterAction;
        } else {
            listCounter = parseInt(rawListCounter, 10);
        }
    }

    return new ParagraphStyle({
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
    });
};

const deserializeBoxStyle = (elem: XmlElem): BoxStyle => {
    const variant = getXmlEnumAttr(elem, "variant", BOX_VARIANTS);
    const color = getXmlEnumAttr(elem, "color", FLOW_COLORS);
    const inline = getBooleanXmlAttr(elem, "inline");
    const source = getOptionalScript(elem, getXmlAttr(elem, "source"));
    let interaction: Interaction | undefined;
    for (const child of (elem.elements || [])) {
        if (hasFlowDocName(child, "interaction")) {
            interaction = deserializeInteraction(child);
        }
    }
    return new BoxStyle({
        variant,
        color,
        inline,
        source,
        interaction,
    });
};

const deserializeInteraction = (elem: XmlElem): Interaction => {
    for (const child of (elem.elements || [])) {
        if (hasFlowDocName(child, "run-script")) {
            const script = getScript(elem, getRequiredXmlAttr(child, "ref"));
            return new RunScript({ script });
        }

        if (hasFlowDocName(child, "open-url")) {
            const url = getRequiredXmlAttr(child, "href");
            return new OpenUrl({ url });
        }
    }

    throw new Error("Expected <run-script> or <open-url>");
};

const deserializeTextStyle = (elem: XmlElem): TextStyle => {
    const bold = getBooleanXmlAttr(elem, "bold");
    const italic = getBooleanXmlAttr(elem, "italic");
    const underline = getBooleanXmlAttr(elem, "underline");
    const strike = getBooleanXmlAttr(elem, "strike");
    const baseline = getXmlEnumAttr(elem, "baseline", BASELINE_OFFSETS);
    const fontFamily = getXmlEnumAttr(elem, "font-family", FONT_FAMILIES);
    const fontSize = getIntegerXmlAttr(elem, "font-size");
    const color = getXmlEnumAttr(elem, "color", FLOW_COLORS);
    const spellcheck = getBooleanXmlAttr(elem, "spellcheck");
    const translate = getBooleanXmlAttr(elem, "translate");
    const lang = getXmlAttr(elem, "lang");
    let link: Interaction | undefined;
    for (const child of (elem.elements || [])) {
        if (hasFlowDocName(child, "link")) {
            link = deserializeInteraction(child);
        }
    }
    return new TextStyle({
        bold,
        italic,
        underline,
        strike,
        baseline,
        fontFamily,
        fontSize,
        link,
        color,
        spellcheck,
        translate,
        lang,
    });
};

const deserializeTableStyle = (elem: XmlElem): TableStyle => {
    const inline = getBooleanXmlAttr(elem, "inline");
    return new TableStyle({ inline });
};

const deserializeImageSource = (elem: XmlElem): ImageSource => {
    const url = getRequiredXmlAttr(elem, "url");
    const width = getRequiredIntegerXmlAttr(elem, "width");
    const height = getRequiredIntegerXmlAttr(elem, "height");
    const placeholder = getXmlAttr(elem, "placeholder");
    const upload = getXmlAttr(elem, "upload");
    return new ImageSource({
        url,
        width,
        height,
        placeholder,
        upload,
    });
};

const deserializeScript = (elem: XmlElem): Script => {
    let code = "";
    const messages = new Map<string, string>();

    for (const child of (elem.elements || [])) {
        if (hasFlowDocName(child, "code")) {
            code = getTextFromElem(child);
        } else if (hasFlowDocName(child, "message")) {
            const key = getRequiredXmlAttr(child, "key");
            const value = deserializeMessageBody(child).join("");
            messages.set(key, value);
        }
    }

    Object.freeze(messages);
    return new Script({ code, messages });
};

const deserializeMessageBody = (elem: XmlElem): string[] => {
    const parts: string[] = [];
    for (const child of (elem.elements || [])) {
        if (hasFlowDocName(child, "c")) {
            parts.push(getTextFromElem(child));
        } else if (hasFlowDocName(child, "t")) {
            parts.push(Script.escapeMessage(getTextFromElem(child)));
        } else if (hasFlowDocName(child, "plural")) {
            parts.push(...deserializeMessagePlural(child));
        } else if (hasFlowDocName(child, "choose")) {
            parts.push(...deserializeMessageSelect(child));
        } else if (hasFlowDocName(child, "count")) {
            parts.push("#");
        } else if (hasFlowDocName(child, "value")) {
            parts.push(...deserializeMessageValue(child));
        }
    }
    return parts;
};

const deserializeMessageValue = (elem: XmlElem): string[] => {
    const arg = getXmlAttr(elem, "var");
    if (!arg) {
        return [];
    }
    return ["{", Script.escapeMessage(arg), "}"];
};

const deserializeMessagePlural = (elem: XmlElem): string[] => {
    const arg = getXmlAttr(elem, "var"); 
    if (!arg) {
        return [];
    }

    const parts = ["{", Script.escapeMessage(arg), ","];

    const mode = getXmlAttr(elem, "mode");
    if (mode === "ordinal") {
        parts.push("selectordinal");
    } else {
        parts.push("plural");
    }

    parts.push(",");

    const offset = getIntegerXmlAttr(elem, "offset");
    if (typeof offset === "number") {
        parts.push(`offset:${offset} `);
    }

    for (const option of (elem.elements || [])) {
        let optionName = getElemInfo(option).flowDocName;
        
        if (optionName === "exact") {
            const eq = getXmlAttr(option, "eq");
            if (eq) {
                optionName = `=${Script.escapeMessage(eq)}`;
            } else {
                optionName = undefined;
            }
        }

        if (!optionName) {
            continue;
        }

        parts.push(optionName, "{");
        parts.push(...deserializeMessageBody(option));
        parts.push("}");
    }                

    parts.push("}");
    return parts;
};

const deserializeMessageSelect = (elem: XmlElem): string[] => {
    const arg = getXmlAttr(elem, "var"); 
    if (!arg) {
        return [];
    }

    const parts = ["{", Script.escapeMessage(arg), ",select,"];

    for (const option of (elem.elements || [])) {
        let optionName = getElemInfo(option).flowDocName;
        
        if (optionName === "when") {
            const eq = getXmlAttr(option, "eq");
            if (eq) {
                optionName = Script.escapeMessage(eq);
            } else {
                optionName = undefined;
            }
        } else if (optionName !== "other") {
            optionName = undefined;
        }

        if (!optionName) {
            continue;
        }

        parts.push(optionName, "{");
        parts.push(...deserializeMessageBody(option));
        parts.push("}");
    }                

    parts.push("}");
    return parts;
};

const getStyle = <T>(
    elem: XmlElem,
    empty: T,
    cache: WeakMap<XmlElem, Map<string, T | null>>,
    localName: string,
    deserialize: (match: XmlElem) => T,
): T => {
    const id = getXmlAttr(elem, "style");
    if (id) {
        return getDefined(elem, id, cache, localName, deserialize);
    } else {
        return empty;
    }
};

const getDefined = <T>(
    elem: XmlElem,
    id: string,
    cache: WeakMap<XmlElem, Map<string, T | null>>,
    localName: string,
    deserialize: (match: XmlElem) => T,
): T => {
    const root = getFlowDoc(elem);
    let map = cache.get(root);
    if (!map) {
        cache.set(root, map = new Map());
    }
    let found = map.get(id);
    if (found === undefined) {
        const match = (root.elements || []).find(child => (
            hasFlowDocName(child, localName) &&
            getXmlAttr(child, "id") === id
        ));
        if (!match) {
            found = null;
        } else {
            found = deserialize(match);
        }
    }
    if (found === null) {
        throw new Error(`Missing <${localName}> with id: ${id}`);
    }
    return found;
};

const getXmlAttr = (elem: XmlElem, attrName: string): string | undefined => {
    const { attributes: { [attrName]: value } = {} } = elem;
    if (typeof value === "string" || typeof value === "undefined") {
        return value;
    } else {
        return String(value);
    }
};

const getRequiredXmlAttr = (elem: XmlElem, attrName: string): string => {
    const value = getXmlAttr(elem, attrName);
    if (value === undefined) {
        throw new Error(`Missing required attribute: ${attrName}`);
    }
    return value;
};

const getIntegerXmlAttr = (elem: XmlElem, attrName: string): number | undefined => {
    const value = getXmlAttr(elem, attrName);
    if (typeof value === "string") {
        const parsed = parseInt(value, 10);
        if (isFinite(parsed)) {
            return parsed;
        }
    }
};

const getRequiredIntegerXmlAttr = (elem: XmlElem, attrName: string): number => {
    const value = getIntegerXmlAttr(elem, attrName);
    if (value === undefined) {
        throw new Error(`Missing required attribute: ${attrName}`);
    }
    return value;
};

const TRUE_OR_FALSE = ["true", "false"] as const;
const getBooleanXmlAttr = (elem: XmlElem, attrName: string): boolean | undefined => {
    const value = getXmlEnumAttr(elem, attrName, TRUE_OR_FALSE);
    if (value === "true") {
        return true;
    } else if (value === "false") {
        return false;
    }
};

const getFloatXmlAttr = (elem: XmlElem, attrName: string): number | undefined => {
    const value = getXmlAttr(elem, attrName);
    if (typeof value === "string") {
        const parsed = parseFloat(value);
        if (isFinite(parsed)) {
            return parsed;
        }
    }
};

const getXmlEnumAttr = <T>(elem: XmlElem, attrName: string, oneOf: readonly T[]): T | undefined => {
    const value = getXmlAttr(elem, attrName) as unknown as T;
    if (oneOf.includes(value)) {
        return value;
    }
};

const getTextFromElem = (elem: XmlElem): string => {
    const { type, text, elements } = elem;
    if (type === "text") {
        if (typeof text === "string") {
            return text;
        } else if (typeof text === "undefined") {
            return "";
        } else {
            return String(text);
        }
    } else if (elements) {
        return elements.map(getTextFromElem).join("");
    } else {
        return "";
    }
};

const FLOWDOCNS = "https://cdn.dforigo.com/schemas/scribing-flowdoc-v1";

const getFlowDoc = (elem: XmlElem): XmlElem => {
    return getElemInfo(elem).root;
};

const hasFlowDocName = (elem: XmlElem, localName: string): boolean => {
    return getElemInfo(elem).flowDocName === localName;
};

function isXmlElemWithParent(elem: XmlElem): elem is XmlElemWithParent {
    return "parent" in elem;
}

const getXmlns = (elem: XmlElem, ns: string): string | null => {
    const { attributes } = elem;
    if (attributes) {
        const xmlns = attributes[ns];
        if (typeof xmlns === "string") {
            return xmlns;
        }
    }
    if (isXmlElemWithParent(elem)) {
        return getXmlns(elem.parent, ns);
    }
    return null;
};

const ElemInfoCache = new WeakMap<XmlElem, XmlElemInfo>();
const getElemInfo = (elem: XmlElem): XmlElemInfo => {
    let info = ElemInfoCache.get(elem);

    if (!info) {
        ElemInfoCache.set(elem, info = createElemInfo(elem));
    }

    return info;
};

const createElemInfo = (elem: XmlElem): XmlElemInfo => {
    const { name: elemName } = elem;
    let flowDocName: string | undefined;
    let root = elem;
    
    if (elemName) {
        const m = /^(?:([^:]+):)?(.+)$/.exec(elemName);        
        if (m) {
            const xmlns = getXmlns(elem, m[1] ? `xmlns:${m[1]}` : "xmlns");
            if (xmlns === FLOWDOCNS) {
                flowDocName = m[2];
            }
        }
    }

    while (isXmlElemWithParent(root) && root.parent.name) {
        root = root.parent;
    }

    return { flowDocName, root };
};

interface XmlElemInfo {
    flowDocName: string | undefined;
    root: XmlElem;
}
