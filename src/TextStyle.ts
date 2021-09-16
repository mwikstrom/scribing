import { booleanType, enumType, frozen, RecordClass, recordClassType, recordType, validating } from "paratype";

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

    // TODO: by name inheritance
    // TODO: background color
    // TODO: foreground color
    // TODO: small caps
    // TODO: font size
    // TODO: font family (weighted?!)
    // TODO: link target
    // TODO: language
}

const Props = {
    bold: booleanType,
    italic: booleanType,
    underline: booleanType,
    strike: booleanType,
    baseline: enumType(["normal", "sub", "super"]),
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
    public static readonly classType = recordClassType(() => TextStyle);
    public static get empty(): TextStyle {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new TextStyle();
        }
        return EMPTY_CACHE;        
    }
    public get isEmpty(): boolean { return this.equals(TextStyle.empty); }
    constructor(props: TextStyleProps = {}) { super(props); }
}

let EMPTY_CACHE: TextStyle | undefined;
