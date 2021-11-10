import { 
    booleanType,
    frozen, 
    nonNegativeIntegerType, 
    nullType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    stringType, 
    unionType, 
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

    /**
     * The script that act as a data source for table body rows
     */
    source?: string | null;

    headerRows?: number;

    footerRows?: number;

    startHeaderColumns?: number;

    endHeaderColumns?: number;
}

const Props = {
    inline: booleanType,
    source: unionType(nullType, stringType),
    headerRows: nonNegativeIntegerType,
    footerRows: nonNegativeIntegerType,
    startHeaderColumns: nonNegativeIntegerType,
    endHeaderColumns: nonNegativeIntegerType,
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
                source: null,
                headerRows: 0,
                footerRows: 0,
                startHeaderColumns: 0,
                endHeaderColumns: 0,
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
