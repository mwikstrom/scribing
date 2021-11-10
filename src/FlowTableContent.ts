import { CellPosition } from "./CellPosition";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowTableCell } from "./FlowTableCell";

/**
 * @public
 */
export class FlowTableContent {
    /**
     * Contains normalized table cells. Keys are string representations of cell positions.
     * This collection is constructed so that it only contains the displayable (and editable)
     * cells.
     * 
     * When normalizing: 
     * 1. When two spanning cells are overlapping, then colspan/rowspan of the top/left-most
     *    spanning cell is reduced until they no longer overlap.
     * 2. Cells that are overlapped by a spanning cell are not included
     */
    readonly #cells = new Map<string, FlowTableCell>();

    /**
     * Contains all overlapped cells. Keys and values are string representations of cell positions.
     * Keys are the overlapped cells. Values are references to the spanning cell.
     */
    readonly #spans = new Map<string, string>();

    constructor(cells: Iterable<[string, FlowTableCell]>, throwOnError?: boolean) {
        for (const [key, cell] of cells) {
            const position = CellPosition.parse(key, throwOnError);
            
            if (position === null) {
                console.warn(`Ignoring invalid cell position: ${key}`);
                continue;
            }
        }
    }

    public get cellCount(): number {
        throw new Error("NOT IMPL");
    }

    public get columnCount(): number {
        throw new Error("NOT IMPL");
    }

    public get rowCount(): number {
        throw new Error("NOT IMPL");
    }

    public getCell(position: CellPosition): FlowTableCell | null {
        throw new Error("NOT IMPL");
    }

    public getIndex(position: CellPosition): number | null {
        throw new Error("NOT IMPL");
    }

    public getPosition(index: number): CellPosition | null {
        throw new Error("NOT IMPL");
    }

    public editContent(position: CellPosition, operation: FlowOperation): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public insertColumn(index: number, count = 1, content = FlowContent.empty): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public removeColumn(index: number, count = 1): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public insertRow(index: number, count = 1, content = FlowContent.empty): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public removeRow(index: number, count = 1): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public mergeCell(position: CellPosition, colSpan: number, rowSpan: number): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public splitMergedCell(position: CellPosition, content = FlowContent.empty): FlowTableContent {
        throw new Error("NOT IMPL");
    }
}