import { 
    constType, 
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    Type, 
    validating 
} from "paratype";
import { BoxStyle } from "./BoxStyle";
import { FlowTheme } from "./FlowTheme";
import { FlowThemeRegistry } from "../internal/class-registry";
import { ParagraphStyle, ParagraphVariant } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { TextStyle, TextStyleProps } from "./TextStyle";

const Data = "default" as const;
const PropsType: RecordType<{/*empty*/}> = recordType({});
const DataType: Type<typeof Data> = constType(Data);
const propsToData = () => Data;

/**
 * The base record class for {@link DefaultFlowTheme}
 * @public
 */
export const DefaultFlowThemeBase = RecordClass(PropsType, FlowTheme, DataType, propsToData);

/**
 * Provides a theme for flow content
 * @sealed
 * @public
 */
@frozen
@validating
@FlowThemeRegistry.register
export class DefaultFlowTheme extends DefaultFlowThemeBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => DefaultFlowTheme);

    /** Gets a cached instance of the default flow theme */
    public static get instance(): DefaultFlowTheme {
        if (!CACHED_INSTANCE) {
            CACHED_INSTANCE = new DefaultFlowTheme();
        }
        return CACHED_INSTANCE;
    }

    constructor() { super({}); }

    /** {@inheritdoc FlowTheme.getBoxTheme} */
    getBoxTheme(style: BoxStyle): FlowTheme {
        return getDefaultBoxTheme(style);
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        return getDefaultBoxTheme(BoxStyle.empty).getParagraphTheme(variant);
    }
}

let CACHED_INSTANCE: DefaultFlowTheme | undefined;
const STRONG_BOX_CACHE = new Map<BoxStyle, DefaultBoxTheme>();
const WEAK_BOX_CACHE = new WeakMap<BoxStyle, DefaultBoxTheme>();

function getDefaultBoxTheme(style: BoxStyle): DefaultBoxTheme {
    let result = WEAK_BOX_CACHE.get(style);

    if (!result) {
        const strong = style.unmerge(BoxStyle.ambient);
        result = STRONG_BOX_CACHE.get(strong);

        if (!result) {
            for (const [key, value] of STRONG_BOX_CACHE.entries()) {
                if (strong.equals(key)) {
                    result = value;
                    break;
                }
            }

            if (!result) {
                STRONG_BOX_CACHE.set(strong, result = new DefaultBoxTheme(strong));
            }
        }
    
        WEAK_BOX_CACHE.set(style, result);
    }

    return result;
}

class DefaultBoxTheme extends FlowTheme {
    readonly #boxStyle: BoxStyle;
    readonly #paragraphThemeCache = new Map<ParagraphVariant, DefaultParagraphTheme>();

    constructor(boxStyle: BoxStyle) {
        super();
        this.#boxStyle = boxStyle;
    }

    /** {@inheritdoc FlowTheme.getBoxTheme} */
    getBoxTheme(style: BoxStyle): FlowTheme {
        return getDefaultBoxTheme(style);
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        let result = this.#paragraphThemeCache.get(variant);
        if (!result) {
            result = new DefaultParagraphTheme(this.#boxStyle, variant);
            this.#paragraphThemeCache.set(variant, result);
        }
        return result;
    }
}

@frozen
@validating
class DefaultParagraphTheme extends ParagraphTheme {
    readonly #box: BoxStyle;
    readonly #text: TextStyle;
    readonly #para: ParagraphStyle;
    readonly #link: TextStyle;
    readonly #next: ParagraphVariant;

    constructor(box: BoxStyle, paraVariant: ParagraphVariant) {
        super();

        this.#box = box;

        this.#text = new TextStyle({
            fontFamily: getFontFamily(paraVariant),
            fontSize: getFontSize(paraVariant),
            bold: isHeadingParagraph(paraVariant),
            italic: box.variant === "quote",
            underline: false,
            strike: false,
            baseline: "normal",
            link: null,
            color: box.color ?? (paraVariant === "subtitle" ? "subtle" : "default"),
            spellcheck: paraVariant !== "code",
        });

        this.#para = new ParagraphStyle({
            variant: paraVariant,
            alignment: "start",
            direction: "ltr",
            lineSpacing: paraVariant === "preamble" ? 110 : 100,
            spaceBefore: getSpaceAbove(paraVariant),
            spaceAfter: getSpaceBelow(paraVariant),
            listLevel: 0,
            listMarker: "unordered",
            hideListMarker: false,
            listCounter: "auto",
            listCounterPrefix: "",
            listCounterSuffix: ". ",
        });

        this.#link = new TextStyle({
            underline: true,
            color: "primary",
        });

        this.#next = paraVariant === "title" ? "subtitle" : paraVariant === "code" ? "code" : "normal";
    }

    /** {@inheritdoc ParagraphTheme.getAmbientTextStyle} */
    getAmbientTextStyle(): TextStyle {
        return this.#text;
    }

    /** {@inheritdoc ParagraphTheme.getAmbientParagraphStyle} */
    getAmbientParagraphStyle(): ParagraphStyle {
        return this.#para;
    }

    /** {@inheritdoc ParagraphTheme.getLinkStyle} */
    getLinkStyle(): TextStyle {
        return this.#link;
    }

    /** {@inheritdoc ParagraphTheme.getNextVariant} */
    getNextVariant(): ParagraphVariant {
        return this.#next;
    }

    /** {@inheritdoc ParagraphTheme.getFlowTheme} */
    getFlowTheme(): FlowTheme {
        return getDefaultBoxTheme(this.#box);
    }
}

const isHeadingParagraph = (variant: ParagraphVariant): boolean => /^h[1-6]$/.test(variant);

const getFontFamily = (variant: ParagraphVariant): TextStyleProps["fontFamily"] => {
    if (variant === "code") {
        return "monospace";
    } else if (isHeadingParagraph(variant) || variant === "title" || variant === "subtitle") {
        return "heading";
    } else {
        return "body";
    }
};

const getFontSize = (variant: ParagraphVariant): number => {
    switch (variant) {
    case "title": return 300;
    case "subtitle": return 125;
    case "h1": return 200;
    case "h2": return 150;
    case "h3": return 117;
    case "h4": return 100;
    case "h5": return 83;
    case "h6": return 67;
    case "code": return 90;
    case "preamble": return 110;
    default: return 100;
    }
};

const getSpaceAbove = (variant: ParagraphVariant): number => {
    if (variant === "title") {
        return 300;
    } else if (variant === "subtitle") {
        return 100;
    } else {
        return getSpaceBelow(variant);
    }
};

const getSpaceBelow = (variant: ParagraphVariant): number => {
    switch (variant) {
    case "subtitle": return 200;
    case "h1": return 134;
    case "h2": return 125;
    case "h3": return 117;
    default: return 100;
    }
};
