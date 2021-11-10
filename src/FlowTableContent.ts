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
            const key = position.toString();

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
                const spannedKey = CellPosition.at(position.row, position.column + colSpan).toString();
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
                this.#spans.set(spanned.toString(), key);
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
        const key = position.toString();
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

    public insertColumn(index: number, count = 1): FlowTableContent {
        if (index < 0 || index > this.#columnCount || count <= 0) {
            return this;
        }

        return this.#update((key, cell) => {
            const pos = CellPosition.parse(key, true);
            if (pos.column >= index) {
                // cell is positioned at or after insertion point. increment position.
                return [CellPosition.at(pos.row, pos.column + count).toString(), cell];
            } else if (pos.column + cell.colSpan > index) {
                // cell is positioned before insertion point but spans over it. increment span.
                return [key, cell.set("colSpan", cell.colSpan + count)];
            } else {
                // cell is unaffected
                return [key, cell];
            }
        });
    }

    public removeColumn(index: number, count = 1): FlowTableContent {
        if (index < 0 || index + count > this.#columnCount || count <= 0) {
            return this;
        }

        return this.#update((key, cell) => {
            const pos = CellPosition.parse(key, true);
            if (pos.column >= index + count) {
                // cell is positioned at or after removed range. decrement position.
                return [CellPosition.at(pos.row, pos.column - count).toString(), cell];
            } else if (pos.column >= index) {
                // cell is positioned within removed range. discard it!
                return null;
            } else if (pos.column + cell.colSpan > index) {
                // cell is positioned before removed range but spans over (or into) it. decrement span.
                const delta = Math.min(count, pos.column + cell.colSpan - index);
                return [key, cell.set("colSpan", cell.colSpan - delta)];
            } else {
                // cell is unaffected
                return [key, cell];
            }
        });
    }

    public insertRow(index: number, count = 1): FlowTableContent {
        if (index < 0 || index > this.#rowCount || count <= 0) {
            return this;
        }

        return this.#update((key, cell) => {
            const pos = CellPosition.parse(key, true);
            if (pos.row >= index) {
                // cell is positioned at or after insertion point. increment position.
                return [CellPosition.at(pos.row + count, pos.column).toString(), cell];
            } else if (pos.row + cell.rowSpan > index) {
                // cell is positioned before insertion point but spans over it. increment span.
                return [key, cell.set("rowSpan", cell.rowSpan + count)];
            } else {
                // cell is unaffected
                return [key, cell];
            }
        });
    }


    public removeRow(index: number, count = 1): FlowTableContent {
        if (index < 0 || index + count > this.#rowCount || count <= 0) {
            return this;
        }

        return this.#update((key, cell) => {
            const pos = CellPosition.parse(key, true);
            if (pos.row >= index + count) {
                // cell is positioned at or after removed range. decrement position.
                return [CellPosition.at(pos.row - count, pos.column).toString(), cell];
            } else if (pos.row >= index) {
                // cell is positioned within removed range. discard it!
                return null;
            } else if (pos.row + cell.rowSpan > index) {
                // cell is positioned before removed range but spans over (or into) it. decrement span.
                const delta = Math.min(count, pos.row + cell.rowSpan - index);
                return [key, cell.set("rowSpan", cell.rowSpan - delta)];
            } else {
                // cell is unaffected
                return [key, cell];
            }
        });
    }

    public merge(position: CellPosition, colSpan: number, rowSpan: number): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    public split(position: CellPosition): FlowTableContent {
        throw new Error("NOT IMPL");
    }

    #update(callback: (key: string, cell: FlowTableCell) => [string, FlowTableCell] | null): FlowTableContent {
        const result = new FlowTableContent();

        result.#defaultCell = this.#defaultCell;
        result.#columnCount = this.#columnCount;
        result.#rowCount = this.#rowCount;

        for (const [key, cell] of this.#cells) {
            const mapped = callback(key, cell);
            if (mapped) {
                const [mappedKey, mappedCell] = mapped;
                result.#cells.set(mappedKey, mappedCell);
                for (const spanned of mappedCell.getSpannedPositions(CellPosition.parse(mappedKey, true))) {
                    result.#spans.set(spanned.toString(), key);
                }
            }
        }

        return result;
    }

    *#iterate(): Iterable<CellPosition> {
        const { rowCount, columnCount } = this;
        const first = rowCount > 0 && columnCount > 0 ? CellPosition.at(0, 0) : null;
        for (let pos = first; pos !== null; pos = pos.next(columnCount, rowCount)) {
            if (!this.#spans.has(pos.toString())) {
                yield pos;
            }
        }
    }
}
