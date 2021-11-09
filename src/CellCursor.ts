import { frozen, validating } from "paratype";
import { CellPosition } from "./CellPosition";
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

    public get position(): CellPosition {
        throw new Error("NOT IMPL");
    }

    public get next(): CellCursor | null {
        throw new Error("NOT IMPL");
    }

    public goto(position: CellPosition): CellCursor | null {
        throw new Error("NOT IMPL");
    }
} 