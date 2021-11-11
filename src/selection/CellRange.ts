import { 
    frozen, 
    RecordClass, 
    recordClassType, 
    RecordType, 
    recordType, 
    stringType, 
    Type, 
    validating, 
} from "paratype";
import { getRangeAfterInsertion, getRangeAfterRemoval } from "../internal/transform-helpers";
import { CellPosition } from "./CellPosition";
import { FlowRange } from "./FlowRange";

const Props = {
    anchor: CellPosition.classType,
    focus: CellPosition.classType,
};
const PropsType: RecordType<CellRangeProps> = recordType(Props);
const PATTERN = /^([A-Z]+[1-9][0-9]*)(?::([A-Z]+[1-9][0-9]*))?$/;
const DataType: Type<CellRangeData> = stringType.restrict(
    "Must be a valid cell range",
    value => PATTERN.test(value),
);
const propsToData = ({anchor, focus}: CellRangeProps): CellRangeData => (
    anchor.equals(focus) ? anchor.toString() : `${anchor}:${focus}`
);

/**
 * The base record class for {@link CellRange}
 * @public
 */
export const CellRangeBase =  RecordClass(PropsType, Object, DataType, propsToData);

/**
 * Non-computed properties of a {@link CellRange}
 * @public
 */
export interface CellRangeProps {
    /**
     * The anchor cell
     */
    anchor: CellPosition;

    /**
     * The focus cell
     */
    focus: CellPosition;
}

/**
 * Data for a {@link CellRange}
 * @public
 */
export type CellRangeData = string;

/**
 * Represents a range of a cells in a table
 * @public
 * @sealed
 */
@frozen
@validating
export class CellRange extends CellRangeBase implements Readonly<CellRangeProps> {
    /** The run-time type that represents this class */
    public static readonly classType = recordClassType(() => CellRange);

    /** Gets a cell range */
    public static at(anchor: CellPosition, focus: CellPosition = anchor): CellRange {
        return new CellRange({ anchor, focus });
    }

    /**
     * Gets a cell range from the specified string
     */
    public static fromData(data: CellRangeData): CellRange {
        return CellRange.parse(data, true);
    }

    public static parse(input: string, throwOnError?: boolean): CellRange | null;
    public static parse(input: string, throwOnError: true): CellRange;
    public static parse(input: string, throwOnError?: boolean): CellRange | null {
        if (typeof input === "string") {
            const match = PATTERN.exec(input);
            if (match) {
                const anchor = CellPosition.parse(match[1]);
                const focus = match[2] ? CellPosition.parse(match[2]) : anchor;
                if (anchor && focus) {
                    return new CellRange({ anchor, focus });
                }
            }
        }
        if (throwOnError) {
            throw new TypeError(`Cannot parse invalid cell range: ${input}`);
        }
        return null;
    }

    public get columnRange(): FlowRange {
        return new FlowRange({ anchor: this.anchor.column, focus: this.focus.column });
    }

    public get rowRange(): FlowRange {
        return new FlowRange({ anchor: this.anchor.row, focus: this.focus.row });
    }

    public get firstColumnIndex(): number {
        return Math.min(this.anchor.column, this.focus.column);
    }

    public get firstRowIndex(): number {
        return Math.min(this.anchor.row, this.focus.row);
    }

    public get lastColumnIndex(): number {
        return Math.max(this.anchor.column, this.focus.column);
    }

    public get lastRowIndex(): number {
        return Math.max(this.anchor.row, this.focus.row);
    }

    /** Determines whether the current range is equal to the other range */
    public equals(other: CellRangeProps): boolean {
        return this.anchor.equals(other.anchor) && this.focus.equals(other.focus);
    }

    /** Gets a string representation of the current cell range */
    public toString(): string {
        return propsToData(this);
    }

    /** Gets a string representation of the current cell range */
    public valueOf(): string {
        return propsToData(this);
    }

    public afterInsertColumn(index: number, count: number): CellRange {
        const range = getRangeAfterInsertion(this.columnRange, FlowRange.at(index, count), true);
        return this.setAxisRange("column", range);
    }

    public afterInsertRow(index: number, count: number): CellRange {
        const range = getRangeAfterInsertion(this.rowRange, FlowRange.at(index, count), true);
        return this.setAxisRange("row", range);
    }

    public afterRemoveColumn(index: number, count: number): CellRange | null {
        const range = getRangeAfterRemoval(this.columnRange, FlowRange.at(index, count));
        return this.setAxisRange("column", range);
    }

    public afterRemoveRow(index: number, count: number): CellRange | null {
        const range = getRangeAfterRemoval(this.rowRange, FlowRange.at(index, count));
        return this.setAxisRange("row", range);
    }

    public setAxisRange(axis: "column" | "row", value: FlowRange): CellRange;
    public setAxisRange(axis: "column" | "row", value: FlowRange | null): CellRange | null;
    public setAxisRange(axis: "column" | "row", value: FlowRange | null): CellRange | null {
        if (value === null) {
            return null;
        } else {
            return new CellRange({
                anchor: this.anchor.set(axis, value.anchor),
                focus: this.focus.set(axis, value.focus),
            });
        }
    }
}
