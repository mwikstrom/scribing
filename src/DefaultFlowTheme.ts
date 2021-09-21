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
import { FlowTheme } from "./FlowTheme";
import { FlowThemeRegistry } from "./internal/class-registry";
import { ParagraphStyle, ParagraphStyleVariant } from "./ParagraphStyle";
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
    #cachedVariants = new Map<ParagraphStyleVariant, DefaultParagraphTheme>();

    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => DefaultFlowTheme);

    /** Gets a cached instance of the default flow theme */
    public static get instance(): DefaultFlowTheme {
        if (!CACHED_ROOT) {
            CACHED_ROOT = new DefaultFlowTheme();
        }
        return CACHED_ROOT;
    }

    constructor() { super({}); }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphStyleVariant): ParagraphTheme {
        let result = this.#cachedVariants.get(variant);
        if (!result) {
            result = new DefaultParagraphTheme(variant);
            this.#cachedVariants.set(variant, result);
        }
        return result;
    }
}

let CACHED_ROOT: DefaultFlowTheme | undefined;

@frozen
@validating
class DefaultParagraphTheme extends ParagraphTheme {
    #text: TextStyle;
    #para: ParagraphStyle;
    #link: TextStyle;
    #next: ParagraphStyleVariant;

    constructor(variant: ParagraphStyleVariant) {
        super();

        this.#text = new TextStyle({
            fontFamily: getFontFamily(variant),
            fontSize: getFontSize(variant),
            bold: isHeading(variant),
            italic: false,
            underline: false,
            strike: false,
            baseline: "normal",
            link: null,
            color: variant === "subtitle" ? "subtle" : "default",
        });

        this.#para = new ParagraphStyle({
            alignment: "start",
            direction: "ltr",
            lineSpacing: variant === "preamble" ? 110 : 100,
            spaceAbove: getSpaceAbove(variant),
            spaceBelow: getSpaceBelow(variant),
            listLevel: 0,
            insideList: false,
            listType: "symbol",
            separateList: false,
            bulletCase: "lower",
            bulletSuffix: ".",
        });

        this.#link = new TextStyle({
            underline: true,
            color: "primary",
        });

        this.#next = variant === "title" ? "subtitle" : variant === "code" ? "code" : "normal";
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
    getNextVariant(): ParagraphStyleVariant {
        return this.#next;
    }
}

const isHeading = (variant: ParagraphStyleVariant): boolean => /^h[1-6]$/.test(variant);

const getFontFamily = (variant: ParagraphStyleVariant): TextStyleProps["fontFamily"] => {
    if (variant === "code") {
        return "monospace";
    } else if (isHeading(variant) || variant === "title" || variant === "subtitle") {
        return "heading";
    } else {
        return "body";
    }
};

const getFontSize = (variant: ParagraphStyleVariant): number => {
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

const getSpaceAbove = (variant: ParagraphStyleVariant): number => {
    if (variant === "title") {
        return 300;
    } else if (variant === "subtitle") {
        return 100;
    } else {
        return getSpaceBelow(variant);
    }
};

const getSpaceBelow = (variant: ParagraphStyleVariant): number => {
    switch (variant) {
    case "subtitle": return 200;
    case "h1": return 134;
    case "h2": return 125;
    case "h3": return 117;
    default: return 100;
    }
};
