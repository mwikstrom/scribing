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
const PropsType: RecordType<CellPositionProps> = recordType(Props);
const PATTERN = /^([A-Z]+)([1-9][0-9]*)$/;
const DataType: Type<CellPositionData> = stringType.restrict(
    "Must be a valid cell position",
    value => PATTERN.test(value),
);
const propsToData = ({column, row}: CellPositionProps): CellPositionData => {
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
 * The base record class for {@link CellPosition}
 * @public
 */
export const CellPositionBase =  RecordClass(PropsType, Object, DataType, propsToData);

/**
 * Non-computed properties of a {@link CellPosition}
 * @public
 */
export interface CellPositionProps {
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
 * Data for a {@link CellPosition} represented by a string with leading upper case
 * ascii letters that represents the column index, followed by ascii digits that
 * represetnts the row index (one-based).
 * 
 * For example; `A1` represents row 0 and column 0, and `DF45` represents row 44 and column 109.
 * @public
 */
export type CellPositionData = string;

/**
 * Represents the position of a cell in a table
 * @public
 * @sealed
 */
@frozen
@validating
export class CellPosition extends CellPositionBase implements Readonly<CellPositionProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => CellPosition);

    /**
     * Gets a cell position from the specified string
     */
    public static fromData(@type(DataType) data: CellPositionData): CellPosition {
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
        return new CellPosition({ column, row });
    }

    /** Determines whether the current position is equal to the other position */
    public equals(other: CellPositionProps): boolean {
        return this.row === other.row && this.column === other.column;
    }

    /** Compares the current position with the specified position */
    public compare(other: CellPositionProps): -1 | 0 | 1 {
        if (this.row < other.row) {
            return -1;
        } else if (this.row > other.row) {
            return 1;
        } else if (this.column < other.column) {
            return -1;
        } else if (this.column > other.column) {
            return 1;
        } else {
            return 0;
        }
    }

    /** Gets a string representation of the current cell position */
    public toString(): string {
        return propsToData(this);
    }
}
