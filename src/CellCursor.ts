import { frozen, validating } from "paratype";
import { CellPointer } from "./CellPointer";
import { FlowTableCell } from "./FlowTableCell";

/**
 * Represents the position of a cell in a table
 * @public
 */
@frozen
@validating
export class CellCursor {
    public get cell(): FlowTableCell {
        throw new Error("NOT IMPL");
    }

    public get pointer(): CellPointer {
        throw new Error("NOT IMPL");
    }

    public get next(): CellCursor | null {
        throw new Error("NOT IMPL");
    }

    public goto(pointer: CellPointer): CellCursor | null {
        throw new Error("NOT IMPL");
    }
} 