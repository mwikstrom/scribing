import { 
    booleanType,
    frozen, 
    RecordClass, 
    recordClassType, 
    recordType, 
    validating
} from "paratype";

/**
 * Style properties for tables
 * @public
 */
export interface TableStyleProps {
    /**
     * Determines whether the table shall be rendered inline
     */
    inline?: boolean;
    // TODO: Add table data source
}

const Props = {
    inline: booleanType,
};

const PropsType = recordType(Props).asPartial();

/**
 * The base record class for {@link TableStyle}
 * @public
 */
export const TableStyleBase = RecordClass(PropsType);
 
/**
 * Represents the styling that is applied to flow table content
 * 
 * @public
 * @sealed
 */
@frozen
@validating
export class TableStyle extends TableStyleBase implements Readonly<TableStyleProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => TableStyle);

    /** Gets the ambient table style */
    public static get ambient(): TableStyle {
        if (!AMBIENT_CACHE) {
            AMBIENT_CACHE = new TableStyle({
                inline: false,
            });
        }
        return AMBIENT_CACHE;
    }

    /** Gets an empty table style */
    public static get empty(): TableStyle {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new TableStyle();
        }
        return EMPTY_CACHE;
    }

    /** Determines whether the current style is empty */
    public get isEmpty(): boolean { return TableStyle.empty.equals(this); }

    constructor(props: TableStyleProps = {}) { super(props); }
}

let EMPTY_CACHE: TableStyle | undefined;
let AMBIENT_CACHE: TableStyle | undefined;
