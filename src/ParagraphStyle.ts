import { 
    booleanType,
    enumType, 
    frozen, 
    integerType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    stringType, 
    Type, 
    unionType, 
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
     * Specifies the list marker kind
     */
    listMarker?: ListMarkerKind;

    /**
     * Specifies whether the list marker is hidden
     */
    hideListMarker?: boolean;

    /**
     * Specifies the list litem counter value
     */
    listCounter?: number | "auto" | "reset" | "resume";

    /**
     * Specifies the list item counter prefix
     */
    listCounterPrefix?: string;

    /**
     * Specifies the list item counter suffix
     */
    listCounterSuffix?: string;

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
 * List marker styles
 * @public
 */
export type ListMarkerKind = OrderedListMarkerKind | UnorderedListMarkerKind;

/**
 * Ordered list marker styles
 * @public
 */
export type OrderedListMarkerKind = (typeof ORDERED_LIST_MARKER_KINDS)[number];

/**
 * Unordered list marker styles
 * @public
 */
export type UnorderedListMarkerKind = (typeof UNORDERED_LIST_MARKER_KINDS)[number];

// TODO: Support hierarchical markers (useful for headings)

/**
 * Read-only array that contains ordered list marker styles
 * @public
 */
export const ORDERED_LIST_MARKER_KINDS = Object.freeze([
    "ordered", // alternating: decimal, lower-alpha, lower-roman
    "decimal",
    "lower-alpha",
    "upper-alpha",
    "lower-roman",
    "upper-roman",
] as const);

/**
 * Read-only array that contains unordered list marker styles
 * @public
 */
export const UNORDERED_LIST_MARKER_KINDS = Object.freeze([
    "unordered", // alternating: disc, circle, square
    "disc",
    "circle",
    "square",
    "dash",
] as const);

/**
 * Read-only array that contains all list marker styles
 * @public
 */
export const LIST_MARKER_KINDS = Object.freeze([
    ...ORDERED_LIST_MARKER_KINDS,
    ...UNORDERED_LIST_MARKER_KINDS,
] as const);

/**
 * The run-time type that matches unordered list marker style values
 * @public
 */
export const UnorderedListMarkerKindType: Type<ListMarkerKind> = enumType(UNORDERED_LIST_MARKER_KINDS);

/**
 * The run-time type that matches ordered list marker style values
 * @public
 */
export const OrderedListMarkerKindType: Type<ListMarkerKind> = enumType(ORDERED_LIST_MARKER_KINDS);

/**
 * The run-time type that matches all list marker style values
 * @public
 */
export const ListMarkerKindType: Type<ListMarkerKind> = enumType(LIST_MARKER_KINDS);

const percentage10to1000 = integerType.restrict(
    "Must be greater than or equal to 10 and less than or equal to 1000",
    value => value >= 10 && value <= 1000,
);

// NOTE: Restricted to keep it safe for inclusion as a CSS literal string
const counterTextType = stringType
    .restrict(
        "Must be a valid counter separator text",
        value => /^[a-zA-Z0-9. ()_-]{0,10}$/.test(value)
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
    listMarker: ListMarkerKindType,
    hideListMarker: booleanType,
    listCounter: unionType(integerType, enumType(["auto", "reset", "resume"])),
    listCounterPrefix: counterTextType,
    listCounterSuffix: counterTextType,
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
