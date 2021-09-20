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
import { ParagraphStyleVariant, ParagraphTheme } from ".";
import { FlowTheme } from "./FlowTheme";
import { FlowThemeRegistry } from "./internal/class-registry";
import { ParagraphStyle } from "./ParagraphStyle";
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

    constructor(variant: ParagraphStyleVariant) {
        super();

        const isHeading = /^h[1-6]$/.test(variant);
        let fontFamily: TextStyleProps["fontFamily"];

        if (variant === "code") {
            fontFamily = "monospace";
        } else if (isHeading || variant === "title" || variant === "subtitle") {
            fontFamily = "sans-serif";
        } else {
            fontFamily = "serif";
        }
        
        this.#text = new TextStyle({
            fontFamily,
            bold: isHeading,
            italic: false,
            underline: false,
            strike: false,
            baseline: "normal",
        });

        this.#para = new ParagraphStyle({
            alignment: "start",
            direction: "ltr",
            lineSpacing: 100,
        });
    }

    /** {@inheritdoc ParagraphTheme.getAmbientTextStyle} */
    getAmbientTextStyle(): TextStyle {
        return this.#text;
    }

    /** {@inheritdoc ParagraphTheme.getAmbientParagraphStyle} */
    getAmbientParagraphStyle(): ParagraphStyle {
        return this.#para;
    }
}
