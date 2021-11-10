import { CellPosition } from "./CellPosition";
import { FlowContent } from "./FlowContent";
import { FlowOperation } from "./FlowOperation";
import { FlowTableCell } from "./FlowTableCell";

/**
 * @public
 */
interface FlowTableContentInitOptions {
    throwOnError?: boolean;
    defaultContent?: FlowContent;
}

/**
 * @public
 * @sealed
 */
export class FlowTableContent {
    #defaultCell: FlowTableCell;
    #cells = new Map<string, FlowTableCell>();
    #spans = new Map<string, string>();
    #columnCount = 0;
    #rowCount = 0;
    #positionArrayCache: readonly CellPosition[] | undefined;

    constructor(cells: Iterable<[string, FlowTableCell]> = [], options: FlowTableContentInitOptions = {}) {
        const { throwOnError = false, defaultContent = FlowContent.empty } = options;
        this.#defaultCell = FlowTableCell.fromData(defaultContent);

        // Sort the given cells by position
        const sorted: [CellPosition, FlowTableCell][] = [];
        for (const [key, cell] of cells) {
            // Skip invalid cell positions
            const position = CellPosition.parse(key, throwOnError);
            if (position === null) {
                console.warn(`Ignoring invalid cell position: ${key}`);
                continue;
            }

            sorted.push([position, cell]);
        }
        sorted.sort(([a], [b]) => a.compare(b));

        // Process cells in order
        for (const entry of sorted) {
            const position = entry[0];
            let cell = entry[1];
            const key = position.valueOf();

            // Skip duplicate cell positions
            if (this.#cells.has(key)) {
                if (throwOnError) throw new Error(`Duplicate cell at: ${key}`);
                console.warn(`Ignoring additional occurance of cell: ${key}`);
                continue;
            }

            // Skip overlapped cell positions
            const overlappedBy = this.#spans.get(key);
            if (overlappedBy) {
                if (throwOnError) throw new Error(`Cell ${key} is overlapped by ${overlappedBy}`);
                console.warn(`Ignoring overlapped cell: ${key} (by ${overlappedBy})`);
                continue;
            }

            // Determine whether cell can span all the columns that it's said to span.
            // We don't allow overlapping spans, i.e. a cell cannot be spanned more than
            // once.
            let colSpan = 1;
            while (colSpan < cell.colSpan) {
                const spannedKey = CellPosition.at(position.row, position.column + colSpan).valueOf();
                const conflictKey = this.#spans.get(spannedKey);
                if (conflictKey) {
                    if (throwOnError) throw new Error(
                        `Cell ${key} cannot span ${cell.colSpan} columns because ` +
                        `cell ${spannedKey} is already overlapped by ${conflictKey}`
                    );
                    console.warn(
                        `Limiting column span of cell ${key} to ${colSpan} (${cell.colSpan} is desired) ` +
                        `because cell ${spannedKey} is already overlapped by ${conflictKey}`
                    );
                    break;
                }                
                ++colSpan;
            }

            // Replace cell with the limited column span if needed
            if (colSpan !== cell.colSpan) {
                cell = cell.set("colSpan", colSpan);
            }

            // Mark overlapped cells
            for (const spanned of cell.getSpannedPositions(position)) {
                this.#spans.set(spanned.valueOf(), key);
            }

            // Keep track of cells, column count and row count
            this.#cells.set(key, cell);
            this.#columnCount = Math.max(this.#columnCount, position.column + cell.colSpan);
            this.#rowCount = Math.max(this.#rowCount, position.row + cell.rowSpan);
        }
    }

    public get columnCount(): number {
        return this.#columnCount;
    }

    public get rowCount(): number {
        return this.#rowCount;
    }

    public get positions(): readonly CellPosition[] {
        if (!this.#positionArrayCache) {
            this.#positionArrayCache = Object.freeze(Array.from(this.#iterate()));
        }
        return this.#positionArrayCache;
    }

    public map<T>(callback: (cell: FlowTableCell, position: CellPosition) => T): T[] {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.positions.map(pos => callback(this.getCell(pos)!, pos));
    }

    public getCell(position: CellPosition): FlowTableCell | null {
        const key = position.valueOf();
        const cell = this.#cells.get(key);
        if (cell) {
            return cell;
        }
        const { columnCount, rowCount } = this;
        if (this.#spans.has(key) || position.row >= rowCount || position.column >= columnCount) {
            return null;
        }
        return this.#defaultCell;
    }

    public edit(position: CellPosition, operation: FlowOperation): FlowTableContent {
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

    public merge(position: CellPosition, colSpan: number, rowSpan: number): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public split(position: CellPosition, content = FlowContent.empty): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    *#iterate(): Iterable<CellPosition> {
        const { rowCount, columnCount } = this;
        const first = rowCount > 0 && columnCount > 0 ? CellPosition.at(0, 0) : null;
        for (let pos = first; pos !== null; pos = pos.next(columnCount, rowCount)) {
            if (!this.#spans.has(pos.valueOf())) {
                yield pos;
            }
        }
    }
}
