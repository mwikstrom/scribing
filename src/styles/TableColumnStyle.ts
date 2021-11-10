import { 
    frozen, 
    numberType, 
    RecordClass, 
    recordClassType, 
    recordType, 
    validating
} from "paratype";

/**
 * Style properties for a table column
 * @public
 */
export interface TableColumnStyleProps {
    width?: number;
}

const Props = {
    width: numberType.restrict("Must be greater than 0 and less than or equal to 1", value => value > 0 && value <= 1),
};

const PropsType = recordType(Props).asPartial();

/**
 * The base record class for {@link TableColumnStyle}
 * @public
 */
export const TableColumnStyleBase = RecordClass(PropsType);
 
/**
 * Represents the styling that is applied to a flow table column
 * 
 * @public
 * @sealed
 */
@frozen
@validating
export class TableColumnStyle extends TableColumnStyleBase implements Readonly<TableColumnStyleProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => TableColumnStyle);

    /** Gets an empty table column style */
    public static get empty(): TableColumnStyle {
        if (!EMPTY_CACHE) {
            EMPTY_CACHE = new TableColumnStyle();
        }
        return EMPTY_CACHE;
    }

    /** Determines whether the current style is empty */
    public get isEmpty(): boolean { return TableColumnStyle.empty.equals(this); }

    constructor(props: TableColumnStyleProps = {}) { super(props); }
}

let EMPTY_CACHE: TableColumnStyle | undefined;
