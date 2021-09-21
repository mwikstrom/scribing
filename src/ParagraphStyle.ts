import { 
    booleanType,
    enumType, 
    frozen, 
    integerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    Type, 
    validating
} from "paratype";

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
    variant?: ParagraphStyleVariant;

    /**
     * The amount of space between lines, as a percentage of normal, where normal is represented as `100`.
     */
    lineSpacing?: number;

    /**
     * The amount of space before the paragraph, as a percentage of the user agent's default font size, 
     * where normal is represented as `100`.
     */
    spaceAbove?: number;

    /**
     * The amount of space before the paragraph, as a percentage of the user agent's default font size, 
     * where normal is represented as `100`.
     */
    spaceBelow?: number;

    /**
     * Specifies the list level. Zero means not a list.
     */
    listLevel?: number;

    /**
     * Specifies whether the paragraph is a continuation of the previous list item. 
     * No bullet is shown and counter is not incremented.
     */
    insideList?: boolean;

    /**
     * Specifies the list type
     */
    listType?: ListStyle;

    /**
     * Specifies whether a new list shall be started after this paragraph
     */
    separateList?: boolean;

    /**
     * Specifies whether list bullet shall use upper or lower case
     */
    bulletCase?: "lower" | "upper";

    /**
     * Specifies the suffix for non-symbolic list bullets
     */
    bulletSuffix?: "." | ")";

    // TODO: by name inheritance
    // TODO: spacing mode
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
}

/**
 * Paragraph style variant
 * @public
 */
export type ParagraphStyleVariant = (typeof PARAGRAPH_STYLE_VARIANTS)[number];

/**
 * Read-only array that contains all paragraph style variants
 * @public
 */
export const PARAGRAPH_STYLE_VARIANTS = Object.freeze([
    "normal",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "title",
    "subtitle",
    "preamble",
    "code",
] as const);

/**
 * The run-time type that matches paragraph style variant values
 * @public
 */
export const ParagraphStyleVariantType: Type<ParagraphStyleVariant> = enumType(PARAGRAPH_STYLE_VARIANTS);

/**
 * List styles
 * @public
 */
export type ListStyle = (typeof LIST_STYLES)[number];

/**
 * Read-only array that contains all list styles
 * @public
 */
export const LIST_STYLES = Object.freeze([
    "symbol", // alternating: disc, circle, square
    "numeric", // alternating: decimal, alpha, roman
    "disc",
    "circle",
    "square",
    "dash",
    "decimal",
    "alpha",
    "roman",
] as const);

/**
 * The run-time type that matches list style values
 * @public
 */
export const ListStyleType: Type<ListStyle> = enumType(LIST_STYLES);

const percentage10to1000 = integerType.restrict(
    "Must be greater than or equal to 10 and less than or equal to 1000",
    value => value >= 10 && value <= 1000,
);

const Props = {
    alignment: enumType(["start", "center", "end", "justify"]),
    direction: enumType(["ltr", "rtl"]),
    variant: ParagraphStyleVariantType,
    lineSpacing: percentage10to1000,
    spaceAbove: percentage10to1000,
    spaceBelow: percentage10to1000,
    listLevel: integerType.restrict(
        "Must be greater than or equal to zero and less than or equal to nine",
        value => value >= 0 && value <= 9,
    ),
    insideList: booleanType,
    listType: ListStyleType,
    separateList: booleanType,
    bulletCase: enumType(["lower", "upper"]),
    bulletSuffix: enumType([".", ")"]),
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
