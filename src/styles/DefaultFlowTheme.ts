import { 
    booleanType,
    constType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    RecordType, 
    stringType, 
    Type, 
    unionType, 
} from "paratype";
import { BoxStyle } from "./BoxStyle";
import { FlowTheme } from "./FlowTheme";
import { FlowThemeRegistry } from "../internal/class-registry";
import { ParagraphStyle, ParagraphVariant } from "./ParagraphStyle";
import { ParagraphTheme } from "./ParagraphTheme";
import { TextStyle, TextStyleProps } from "./TextStyle";

const Props = {
    lang: stringType,
    rtl: booleanType,
};
const DEFAULT_CONST = "default" as const;
const PropsType: RecordType<DefaultFlowThemeProps> = recordType(Props);
const DataType: Type<DefaultFlowThemeData> = unionType(
    constType(DEFAULT_CONST),
    PropsType.asPartial()
);
const propsToData = (props: DefaultFlowThemeProps): DefaultFlowThemeData => {
    const { lang, rtl } = props;
    if (!lang && !rtl) {
        return DEFAULT_CONST;
    }
    const data: Partial<DefaultFlowThemeProps> = {};
    if (lang) {
        data.lang = lang;
    }
    if (rtl) {
        data.rtl = rtl;
    }
    return data;
};

/**
 * Properties for {@link DefaultFlowTheme}
 * @public
 */
export interface DefaultFlowThemeProps {
    lang: string;
    rtl: boolean;
}

/**
 * Data for {@link DefaultFlowTheme}
 * @public
 */
export type DefaultFlowThemeData = "default" | Partial<DefaultFlowThemeProps>;

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
@FlowThemeRegistry.register
export class DefaultFlowTheme extends DefaultFlowThemeBase {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => DefaultFlowTheme);

    public static fromData(data: DefaultFlowThemeData): DefaultFlowTheme {
        if (data === "default") {
            data = {};
        }
        const { lang, rtl } = data;
        return DefaultFlowTheme.get(lang, rtl);
    }

    /** Gets a cached instance of the default flow theme */
    public static get instance(): DefaultFlowTheme { return DefaultFlowTheme.get(); }

    public static get(lang = "", rtl = false): DefaultFlowTheme {
        let entry = BY_LANG_CACHE.get(lang);
        if (!entry) {
            BY_LANG_CACHE.set(lang, entry = {});
        }
        const prop: "rtl" | "ltr" = rtl ? "rtl" : "ltr";
        let found = entry[prop];
        if (!found) {
            entry[prop] = found = new DefaultFlowTheme({lang, rtl});
        }
        return found;
    }

    readonly #strongBoxCache = new Map<BoxStyle, DefaultBoxTheme>();
    readonly #weakBoxCache = new WeakMap<BoxStyle, DefaultBoxTheme>();
    
    /** {@inheritdoc FlowTheme.getBoxTheme} */
    getBoxTheme(style: BoxStyle): FlowTheme {
        let result = this.#weakBoxCache.get(style);

        if (!result) {
            const strong = style.unmerge(BoxStyle.ambient);
            result = this.#strongBoxCache.get(strong);
    
            if (!result) {
                for (const [key, value] of this.#strongBoxCache.entries()) {
                    if (strong.equals(key)) {
                        result = value;
                        break;
                    }
                }
    
                if (!result) {
                    this.#strongBoxCache.set(strong, result = new DefaultBoxTheme(this, strong));
                }
            }
        
            this.#weakBoxCache.set(style, result);
        }
    
        return result;
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        return this.getBoxTheme(BoxStyle.empty).getParagraphTheme(variant);
    }
}

const BY_LANG_CACHE = new Map<string, {rtl?: DefaultFlowTheme, ltr?: DefaultFlowTheme}>();

class DefaultBoxTheme extends FlowTheme {
    readonly #root: DefaultFlowTheme;
    readonly #boxStyle: BoxStyle;
    readonly #paragraphThemeCache = new Map<ParagraphVariant, DefaultParagraphTheme>();

    constructor(root: DefaultFlowTheme, boxStyle: BoxStyle) {
        super();
        this.#root = root;
        this.#boxStyle = boxStyle;
    }

    /** {@inheritdoc FlowTheme.getBoxTheme} */
    getBoxTheme(style: BoxStyle): FlowTheme {
        return this.#root.getBoxTheme(style);
    }

    /** {@inheritdoc FlowTheme.getParagraphTheme} */
    getParagraphTheme(variant: ParagraphVariant): ParagraphTheme {
        let result = this.#paragraphThemeCache.get(variant);
        if (!result) {
            result = new DefaultParagraphTheme(this.#root, this.#boxStyle, variant);
            this.#paragraphThemeCache.set(variant, result);
        }
        return result;
    }
}

class DefaultParagraphTheme extends ParagraphTheme {
    readonly #root: DefaultFlowTheme;
    readonly #box: BoxStyle;
    readonly #text: TextStyle;
    readonly #para: ParagraphStyle;
    readonly #link: TextStyle;
    readonly #next: ParagraphVariant;

    constructor(root: DefaultFlowTheme, box: BoxStyle, paraVariant: ParagraphVariant) {
        super();

        this.#root = root;
        this.#box = box;

        this.#text = new TextStyle({
            fontFamily: getFontFamily(paraVariant),
            fontSize: getFontSize(paraVariant),
            bold: isBoldHeadingParagraph(paraVariant),
            italic: box.variant === "quote" || paraVariant === "h6",
            underline: false,
            strike: false,
            baseline: "normal",
            link: null,
            color: box.color ?? (paraVariant === "subtitle" ? "subtle" : "default"),
            lang: root.lang,
            spellcheck: paraVariant !== "code",
            translate: paraVariant !== "code",
        });

        this.#para = new ParagraphStyle({
            variant: paraVariant,
            alignment: "start",
            direction: root.rtl ? "rtl" : "ltr",
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
        return this.#root.getBoxTheme(this.#box);
    }
}

const isHeadingParagraph = (variant: ParagraphVariant): boolean => /^h[1-6]$/.test(variant);
const isBoldHeadingParagraph = (variant: ParagraphVariant): boolean => /^h[1-4]$/.test(variant);

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
    case "h5": return 100;
    case "h6": return 100;
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
