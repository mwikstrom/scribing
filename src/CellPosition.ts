import { 
    frozen, 
    nonNegativeIntegerType, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    stringType, 
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
const propsToData = ({column, row}: CellPositionProps): CellPositionData => (
    CellPosition.stringifyColumnIndex(column, true) + 
    CellPosition.stringifyRowIndex(row, true)
);

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

    /** Gets a cell position at the specified row and column */
    public static at(row: number, column: number): CellPosition {
        // TODO: Use cache (to reuse cell position instances)
        return new CellPosition({ column, row });
    }

    /**
     * Gets a cell position from the specified string
     */
    public static fromData(data: CellPositionData): CellPosition {
        return CellPosition.parse(data, true);
    }

    public static parse(input: string, throwOnError?: boolean): CellPosition | null;
    public static parse(input: string, throwOnError: true): CellPosition;
    public static parse(input: string, throwOnError?: boolean): CellPosition | null {
        // TODO: Use cache (to reuse cell position instances)
        if (typeof input === "string") {
            const match = PATTERN.exec(input);
            if (match) {
                const column = CellPosition.parseColumnIndex(match[1]);
                const row = CellPosition.parseRowIndex(match[2]);
                if (typeof column === "number" && typeof row === "number") {
                    return new CellPosition({ column, row });
                }
            }
        }
        if (throwOnError) {
            throw new TypeError(`Cannot parse invalid cell position: ${input}`);
        }
        return null;
    }

    public static parseColumnIndex(input: string, throwOnError?: boolean): number | null;
    public static parseColumnIndex(input: string, throwOnError: true): number;
    public static parseColumnIndex(input: string, throwOnError?: boolean): number | null {
        if (typeof input === "string" && /^[A-Z]+$/.test(input)) {
            let column = -1;
            let multiplier = 26 ** (input.length - 1);
            for (let i = 0; i < input.length; ++i) {
                const charValue = input.charCodeAt(i) - 64;
                column += charValue * multiplier;
                multiplier /= 26;
            }
            return column;
        } else if (throwOnError) {
            throw new TypeError(`Cannot parse invalid column index: ${input}`);
        } else {
            return null;
        }
    }

    public static stringifyColumnIndex(input: number, throwOnError?: boolean): string | null;
    public static stringifyColumnIndex(input: number, throwOnError: true): string;
    public static stringifyColumnIndex(input: number, throwOnError?: boolean): string | null {
        if (Number.isSafeInteger(input) && input >= 0) {
            let result = "";
            while (input >= 26) {
                const rem = input % 26;
                result = String.fromCharCode(65 + rem) + result;
                input = (input - rem) / 26 - 1;
            }
            return String.fromCharCode(65 + input) + result;
        } else if (throwOnError) {
            throw new TypeError(`Cannot stringify invalid column index: ${input}`);
        } else {
            return null;
        }
    }

    public static parseRowIndex(input: string, throwOnError?: boolean): number | null;
    public static parseRowIndex(input: string, throwOnError: true): number;
    public static parseRowIndex(input: string, throwOnError?: boolean): number | null {
        if (typeof input === "string" && /^[1-9][0-9]*$/.test(input)) {
            return parseInt(input, 10) - 1;
        } else if (throwOnError) {
            throw new TypeError(`Cannot parse invalid row index: ${input}`);
        } else {
            return null;
        }
    }

    public static stringifyRowIndex(input: number, throwOnError?: boolean): string | null;
    public static stringifyRowIndex(input: number, throwOnError: true): string;
    public static stringifyRowIndex(input: number, throwOnError?: boolean): string | null {
        if (Number.isSafeInteger(input) && input >= 0) {
            return (input + 1).toFixed();
        } else if (throwOnError) {
            throw new TypeError(`Cannot stringify invalid row index: ${input}`);
        } else {
            return null;
        }
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

    /** Gets a string representation of the current cell position */
    public valueOf(): string {
        return propsToData(this);
    }
}
