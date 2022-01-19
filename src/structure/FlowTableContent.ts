import { classType, JsonValue, mapType, PathArray, ErrorCallback, lazyType } from "paratype";
import { CellPosition } from "../selection/CellPosition";
import { FlowContent } from "./FlowContent";
import { FlowTableCell } from "./FlowTableCell";
import type { FlowNodeVisitor } from "./FlowNodeVisitor";

/**
 * @public
 */
interface FlowTableContentOptions {
    throwOnError?: boolean;
    defaultContent?: FlowContent;
}

const DataType = mapType(FlowTableCell.classType);

/**
 * @public
 * @sealed
 */
export class FlowTableContent {
    #defaultContent: FlowContent;
    #cells = new Map<string, FlowTableCell>();
    #spans = new Map<string, string>();
    #columnCount = 1;
    #rowCount = 1;
    #positionArrayCache: readonly CellPosition[] | undefined;

    static readonly classType = lazyType(() => classType<
        typeof FlowTableContent, FlowTableContent, [Map<string, FlowTableCell>]
    >(FlowTableContent));

    static fromJsonValue(value: JsonValue, error?: ErrorCallback, path?: PathArray): FlowTableContent {
        const data = DataType.fromJsonValue(value, error, path);
        const defaultContent = data.get("default")?.content;
        data.delete("default");
        return new FlowTableContent(data, { defaultContent });
    }

    constructor(cells: Iterable<[string, FlowTableCell]> = [], options: FlowTableContentOptions = {}) {
        const { throwOnError = false, defaultContent = FlowContent.empty } = options;
        this.#defaultContent = defaultContent;

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

            // Store cell (also marking overlapped cells)
            this.#dangerouslySetCell(key, cell);

            // Keep track of cells, column count and row count
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

    public get defaultCellContent(): FlowContent {
        return this.#defaultContent;
    }

    public accept(visitor: FlowNodeVisitor): FlowTableContent {
        return visitor.visitTableContent(this);
    }

    public toJsonValue(error?: ErrorCallback, path?: PathArray): JsonValue {
        const sorted = Array.from(this.#cells.entries())
            .sort((a, b) => CellPosition.parse(a[0], true).compare(CellPosition.parse(b[0], true)));
        const data = new Map(sorted);
        data.set("default", FlowTableCell.fromData(this.#defaultContent));

        // Ensure that the bottom-right cell is filled to maintain row and column count
        const lastKey = CellPosition.at(this.#rowCount - 1, this.#columnCount - 1).toString();
        if (!this.#cells.has(lastKey) && !this.#spans.has(lastKey)) {
            data.set(lastKey, FlowTableCell.fromData(this.#defaultContent));
        }

        return DataType.toJsonValue(data, error, path);
    }

    public map<T>(callback: (cell: FlowTableCell, position: CellPosition) => T): T[] {
        return this.positions.map(pos => callback(this.getCell(pos, true), pos));
    }

    public getCell(position: CellPosition, throwOnError?: boolean): FlowTableCell | null;
    public getCell(position: CellPosition, throwOnError: true): FlowTableCell;
    public getCell(position: CellPosition, throwOnError?: boolean): FlowTableCell | null {
        const key = position.toString();
        const cell = this.#cells.get(key);
        if (cell) {
            return cell;
        }
        const { columnCount, rowCount } = this;
        const spanningKey = this.#spans.get(key);
        if (spanningKey) {
            const message = `Table position ${position} is overlapped by ${spanningKey}`;
            if (throwOnError) throw new Error(message);
            console.warn(message);
            return null;
        }
        if (
            position.row < 0 || 
            position.row >= rowCount || 
            position.column < 0 ||
            position.column >= columnCount
        ) {
            const message = `Table position ${position} is out of range`;
            if (throwOnError) throw new RangeError(message);
            console.warn(message);
            return null;
        }
        return FlowTableCell.fromData(this.#defaultContent);
    }

    public setContent(position: CellPosition, content: FlowContent): FlowTableContent {
        const before = this.getCell(position, true);
        const after = before.set("content", content);
        return this.#replaceCell(position, after);
    }

    public updateAllContent(
        callback: (content: FlowContent, position: CellPosition) => FlowContent
    ): FlowTableContent {
        const changed = new Map<string, FlowTableCell>();
        for (const position of this.positions) {
            const cell = this.getCell(position, true);
            const oldContent = cell.content;
            const newContent = callback(oldContent, position);
            if (!oldContent.equals(newContent)) {
                changed.set(position.toString(), cell.set("content", newContent));
            }
        }
        if (changed.size === 0) {
            return this;
        }
        return this.#update((key, cell) => [key, changed.get(key) ?? cell]);
    }

    public insertColumn(index: number, count = 1): FlowTableContent {
        if (count < 0) {
            throw new RangeError("Cannot insert a negative number of columns");
        } else if (count === 0) {
            return this;
        } else if (index < 0 || index > this.#columnCount) {
            throw new RangeError(`Column index ${index} is out of range`);
        }
        const updated = this.#update((key, cell) => {
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
        updated.#columnCount += count;
        return updated;
    }

    public removeColumn(index: number, count = 1): FlowTableContent {
        if (count < 0) {
            throw new RangeError("Cannot remove a negative number of columns");
        } else if (count === 0) {
            return this;
        } else if (index < 0) {
            throw new RangeError(`Column index ${index} is out of range`);
        } else if (index + count >= this.#columnCount) {
            throw new RangeError(`Column index ${index + count} is out of range`);
        }
        const updated = this.#update((key, cell) => {
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
        updated.#columnCount -= count;
        return updated;
    }

    public insertRow(index: number, count = 1): FlowTableContent {
        if (count < 0) {
            throw new RangeError("Cannot insert a negative number of rows");
        } else if (count === 0) {
            return this;
        } else if (index < 0 || index > this.#rowCount) {
            throw new RangeError(`Row index ${index} is out of range`);
        }
        const updated = this.#update((key, cell) => {
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
        updated.#rowCount += count;
        return updated;
    }


    public removeRow(index: number, count = 1): FlowTableContent {
        if (count < 0) {
            throw new RangeError("Cannot remove a negative number of rows");
        } else if (count === 0) {
            return this;
        } else if (index < 0) {
            throw new RangeError(`Row index ${index} is out of range`);
        } else if (index + count >= this.#rowCount) {
            throw new RangeError(`Row index ${index + count} is out of range`);
        }
        const updated = this.#update((key, cell) => {
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
        updated.#rowCount -= count;
        return updated;
    }

    public merge(position: CellPosition, colSpan: number, rowSpan: number): FlowTableContent {
        const before = this.getCell(position, true);
        const after = before.merge({ colSpan, rowSpan });
        const slated = new Set(after.getSpannedPositions(position, true).map(pos => pos.toString()));
        return this.#update((key, cell) => {
            if (!slated.has(key)) {
                return [key, cell];
            } else if (cell.colSpan !== 1 || cell.rowSpan !== 1) {
                throw new Error(`Table position ${key} is already merged`);
            } else {
                return null;
            } 
        }).#dangerouslySetCell(position.toString(), after);
    }

    public split(position: CellPosition): FlowTableContent {
        const before = this.getCell(position, true);
        const after = before.merge({ colSpan: 1, rowSpan: 1 });
        return this.#replaceCell(position, after);
    }

    #replaceCell(position: CellPosition, replacement: FlowTableCell): FlowTableContent {
        const target = position.toString();
        let replaced = false;
        const result = this.#update((key, cell) => {
            if (key === target) {
                replaced = true;
                return [key, replacement];
            } else {
                return [key, cell];
            }
        });        
        if (!replaced) {
            result.#dangerouslySetCell(target, replacement);
        }
        return result;
    }

    #update(callback: (key: string, cell: FlowTableCell) => [string, FlowTableCell] | null): FlowTableContent {
        const result = new FlowTableContent();

        result.#defaultContent = this.#defaultContent;
        result.#columnCount = this.#columnCount;
        result.#rowCount = this.#rowCount;

        for (const [key, cell] of this.#cells) {
            const mapped = callback(key, cell);
            if (mapped) {
                const [mappedKey, mappedCell] = mapped;
                result.#dangerouslySetCell(mappedKey, mappedCell);
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

    #dangerouslySetCell(key: string, cell: FlowTableCell): this {
        const pos = CellPosition.parse(key, true);
        this.#cells.set(key, cell);
        for (const spanned of cell.getSpannedPositions(pos)) {
            this.#spans.set(spanned.toString(), key);
        }
        return this;
    }
}
