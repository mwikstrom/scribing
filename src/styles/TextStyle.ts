import { 
    booleanType,
    enumType,
    integerType,
    nullType,
    RecordClass,
    recordClassType,
    recordType,
    stringType,
    unionType,
} from "paratype";
import { FlowColor, FlowColorType } from "./FlowColor";
import { Interaction } from "../interaction/Interaction";

/**
 * Style properties for {@link TextRun|text}
 * @public
 */
export interface TextStyleProps {
    /** Whether or not the text is rendered as bold. */
    bold?: boolean;

    /** Whether or not the text is italicized. */
    italic?: boolean;

    /** Whether or not the text is underlined. */
    underline?: boolean;

    /** Whether or not the text is struck through. */
    strike?: boolean;

    /**
     * The text's vertical position.
     * @remarks
     * - `normal`: Text is placed on the normal baseline
     * 
     * - `sub`: Text is placed in the subscript position
     * 
     * - `super`: Text is placed in the superscript position
     */
    baseline?: BaselineOffset;

    /**
     * The text's font family.
     */
    fontFamily?: FontFamily;

    /**
     * The text's font size, as a percentage of the user agent's default font size,
     * where normal is represented as `100`.
     */
    fontSize?: number;

    /**
     * When non-null, indicates that text shall be styled as a link with the specified
     * interaction.
     */
    link?: Interaction | null;

    /**
     * The text's foreground color
     */
    color?: FlowColor;

    /**
     * Determines whether text shall be checked for spelling errors
     */
    spellcheck?: boolean;    

    /**
     * Determines whether text shall be translated
     */
    translate?: boolean;    

    /**
     * Specifies the written language
     */
    lang?: string;

    // TODO: by name inheritance
    // TODO: background color
    // TODO: small caps
}

/**
 * Baseline offset
 * @public
 */
export type BaselineOffset = (typeof BASELINE_OFFSETS)[number];

/**
 * Read-only array that contains all baseline offsets
 * @public
 */
export const BASELINE_OFFSETS = Object.freeze([
    "normal",
    "sub",
    "super"
] as const);

/**
 * Font family
 * @public
 */
export type FontFamily = (typeof FONT_FAMILIES)[number];

/**
 * Read-only array that contains all font families
 * @public
 */
export const FONT_FAMILIES = Object.freeze([
    "body",
    "heading",
    "monospace",
    "cursive",
    "decorative",
] as const);

const Props = {
    bold: booleanType,
    italic: booleanType,
    underline: booleanType,
    strike: booleanType,
    baseline: enumType(BASELINE_OFFSETS),
    fontFamily: enumType(FONT_FAMILIES),
    fontSize: integerType.restrict(
        "Must be greater than or equal to 10 and less than or equal to 1000",
        value => value >= 10 && value <= 1000,
    ),
    link: unionType(nullType, Interaction.baseType),
    color: FlowColorType,
    spellcheck: booleanType,
    translate: booleanType,
    lang: stringType,
};

const PropsType = recordType(Props).asPartial();

/**
 * The base record class for {@link TextStyle}
 * @public
 */
export const TextStyleBase = RecordClass(PropsType);

/**
 * Represents the styling that is applied to text.
 * 
 * @public
 * @sealed
 */
export class TextStyle extends TextStyleBase implements Readonly<TextStyleProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => TextStyle);

    /** Gets an empty text style */
    public static get empty(): TextStyle {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new TextStyle();
        }
        return EMPTY_CACHE;        
    }

    /** Determines whether the current style is empty */
    public get isEmpty(): boolean { return this.equals(TextStyle.empty); }
    
    constructor(props: TextStyleProps = {}) { super(props); }
}

let EMPTY_CACHE: TextStyle | undefined;
