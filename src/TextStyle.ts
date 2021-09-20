import { 
    booleanType,
    enumType,
    frozen,
    integerType,
    nullType,
    RecordClass,
    recordClassType,
    recordType,
    unionType,
    validating
} from "paratype";
import { Interaction } from "./Interaction";

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
    baseline?: "normal" | "sub" | "super";

    /**
     * The text's font family.
     */
    fontFamily?: "body" | "heading" | "monospace";

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
    color?: "default" | "primary" | "secondary" | "warning" | "error" | "information" | "success" | "subtle";

    // TODO: by name inheritance
    // TODO: background color
    // TODO: small caps
    // TODO: language
}

const Props = {
    bold: booleanType,
    italic: booleanType,
    underline: booleanType,
    strike: booleanType,
    baseline: enumType(["normal", "sub", "super"]),
    fontFamily: enumType(["body", "heading", "monospace"]),
    fontSize: integerType.restrict(
        "Must be greater than or equal to 10 and less than or equal to 1000",
        value => value >= 10 && value <= 1000,
    ),
    link: unionType(nullType, Interaction.baseType),
    color: enumType(["default", "primary", "secondary", "warning", "error", "information", "success", "subtle"])
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
@frozen
@validating
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
