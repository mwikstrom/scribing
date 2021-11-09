import { 
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    stringType, 
    type, 
    Type, 
    validating, 
} from "paratype";

const Props = {
    column: nonNegativeIntegerType,
    row: nonNegativeIntegerType,
};
const PropsType: RecordType<CellPointerProps> = recordType(Props);
const PATTERN = /^([A-Z]+)([1-9][0-9]*)$/;
const DataType: Type<CellPointerData> = stringType.restrict(
    "Must be a valid cell pointer",
    value => PATTERN.test(value),
);
const propsToData = ({column, row}: CellPointerProps): CellPointerData => {
    let columnChars = "";
    while (column >= 26) {
        const rem = column % 26;
        columnChars = String.fromCharCode(65 + rem) + columnChars;
        column = (column - rem) / 26 - 1;
    }
    columnChars = String.fromCharCode(65 + column) + columnChars;
    return `${columnChars}${(row + 1).toFixed()}`;
};

/**
 * The base record class for {@link CellPointer}
 * @public
 */
export const CellPointerBase =  RecordClass(PropsType, Object, DataType, propsToData);

/**
 * Non-computed properties of a {@link CellPointer}
 * @public
 */
export interface CellPointerProps {
    /**
     * The zero-based column index
     */
    column: number;

    /**
     * The zero-based row index
     */
    row: number;
}

/**
 * Data for a {@link CellPointer} represented by a string with leading upper case
 * ascii letters that represents the column index, followed by ascii digits that
 * represetnts the row index (one-based).
 * 
 * For example; `A1` represents row 0 and column 0, and `DF45` represents row 44 and column 109.
 * @public
 */
export type CellPointerData = string;

/**
 * Represents a pointer to a table cell
 * @public
 * @sealed
 */
@frozen
@validating
export class CellPointer extends CellPointerBase implements Readonly<CellPointerProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => CellPointer);

    /**
     * Gets a cell pointer from the specified string
     */
    public static fromData(@type(DataType) data: CellPointerData): CellPointer {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const [, columnChars, rowDigits] = PATTERN.exec(data)!;
        let column = -1;
        let multiplier = 26 ** (columnChars.length - 1);
        for (let i = 0; i < columnChars.length; ++i) {
            const charValue = columnChars.charCodeAt(i) - 64;
            column += charValue * multiplier;
            multiplier /= 26;
        }
        const row = parseInt(rowDigits, 10) - 1;
        return new CellPointer({ column, row });
    }

    /** Gets a string representation of the current cell pointer */
    public toString(): string {
        return propsToData(this);
    }
}
