import { 
    booleanType,
    enumType, 
    frozen, 
    nullType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    Type, 
    unionType, 
    validating
} from "paratype";
import { FlowColor, FlowColorType } from "./FlowColor";
import { Interaction } from "../interaction/Interaction";
import { Script } from "../script";

/**
 * Style properties for box content
 * @public
 */
export interface BoxStyleProps {
    /**
     * The style variant of the box.
     */
    variant?: BoxVariant;

    /**
     * Color of the box
     */
    color?: FlowColor;

    /**
     * Determines whether the box shall be rendered inline
     */
    inline?: boolean;

    /**
     * The script that act as a data source for the box
     */
    source?: Script | null;

    /**
     * The interaction that shall be invoked when the box is clicked
     */
    interaction?: Interaction | null;
}

/**
 * Box style variant
 * @public
 */
export type BoxVariant = (typeof BOX_VARIANTS)[number];

/**
 * Read-only array that contains all box style variants
 * @public
 */
export const BOX_VARIANTS = Object.freeze([
    "basic",
    "contained",
    "outlined",
    "alert",
    "quote",
] as const);

/**
 * The run-time type that matches box style variant values
 * @public
 */
export const BoxVariantType: Type<BoxVariant> = enumType(BOX_VARIANTS);

const Props = {
    variant: BoxVariantType,
    color: FlowColorType,
    inline: booleanType,
    source: unionType(nullType, Script.classType),
    interaction: unionType(nullType, Interaction.baseType),
};

const PropsType = recordType(Props).asPartial();

/**
 * The base record class for {@link BoxStyle}
 * @public
 */
export const BoxStyleBase = RecordClass(PropsType);
 
/**
 * Represents the styling that is applied to box content.
 * 
 * @public
 * @sealed
 */
@frozen
@validating
export class BoxStyle extends BoxStyleBase implements Readonly<BoxStyleProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => BoxStyle);

    /** Gets the ambient box style */
    public static get ambient(): BoxStyle {
        if (!AMBIENT_CACHE) {
            AMBIENT_CACHE = new BoxStyle({
                variant: "basic",
                color: "default",
                inline: true,
                source: null,
                interaction: null,
            });
        }
        return AMBIENT_CACHE;
    }

    /** Gets an empty box style */
    public static get empty(): BoxStyle {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new BoxStyle();
        }
        return EMPTY_CACHE;
    }

    /** Determines whether the current style is empty */
    public get isEmpty(): boolean { return BoxStyle.empty.equals(this); }

    constructor(props: BoxStyleProps = {}) { super(props); }
}

let EMPTY_CACHE: BoxStyle | undefined;
let AMBIENT_CACHE: BoxStyle | undefined;