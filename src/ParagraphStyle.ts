import { enumType, frozen, integerType, RecordClass, recordClassType, recordType, validating } from "paratype";
import { StyleVariant, StyleVariantType } from "./StyleVariant";

/**
 * Style properties for paragraph content
 * @public
 */
export interface ParagraphStyleProps {
    /**
     * The alignment for paragraph content.
     * @remarks
     * - `start`: The paragraph is aligned to the start of the line. Left-aligned for LTR text, right-aligned otherwise.
     * 
     * - `center`: The paragraph is centered.
     * 
     * - `end`: The paragraph is aligned to the end of the line. Right-aligned for LTR text, left-aligned otherwise.
     * 
     * - `justify`: The paragraph is justify.
     */
    alignment?: "start" | "center" | "end" | "justify";

    /**
     * The reading direction of paragraph content.
     * @remarks
     * - `ltr`: The content goes from left to right.
     * 
     * - `rtl`: The content goes from right to left.
     */
    direction?: "ltr" | "rtl";

    /**
     * The style variant of the paragraph.
     */
    variant?: StyleVariant;

    /**
     * The amount of space between lines, as a percentage of normal, where normal is represented as `100`.
     */
    line_spacing?: number;

    // TODO: by name inheritance
    // TODO: spacing mode
    // TODO: space above
    // TODO: space below
    // TODO: border between
    // TODO: border top, bottom, left, right
    // TODO: indent first line
    // TODO: indent start
    // TODO: indent end
    // TODO: tab stops
    // TODO: keep lines together
    // TODO: keep with next
    // TODO: avoid widow and orphan
    // TODO: shading
    // TODO: bullet (probably another obj)
}

const Props = {
    alignment: enumType(["start", "center", "end", "justify"]),
    direction: enumType(["ltr", "rtl"]),
    variant: StyleVariantType,
    line_spacing: integerType.restrict(
        "Must be greater than or equal to 10 and less than or equal to 1000",
        value => value >= 10 && value <= 1000,
    ),
};

const PropsType = recordType(Props).asPartial();

/**
 * The base record class for {@link ParagraphStyle}
 * @public
 */
export const ParagraphStyleBase = RecordClass(PropsType);
 
/**
 * Represents the styling that is applied to paragraph content.
 * 
 * @public
 * @sealed
 */
@frozen
@validating
export class ParagraphStyle extends ParagraphStyleBase implements Readonly<ParagraphStyleProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => ParagraphStyle);

    /** Gets an empty paragraph style */
    public static get empty(): ParagraphStyle {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new ParagraphStyle();
        }
        return EMPTY_CACHE;
    }

    /** Determines whether the current style is empty */
    public get isEmpty(): boolean { return ParagraphStyle.empty.equals(this); }

    constructor(props: ParagraphStyleProps = {}) { super(props); }
}

let EMPTY_CACHE: ParagraphStyle | undefined;
