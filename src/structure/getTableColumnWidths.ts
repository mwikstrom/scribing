import { CellPosition } from "../selection/CellPosition";
import { TableColumnStyle } from "../styles/TableColumnStyle";

/** @public */
export function getTableColumnWidths(
    columnCount: number,
    columnStyles: ReadonlyMap<string, TableColumnStyle>
): string[] {
    if (columnCount <= 0) {
        return [];
    }

    const relative: number[] = [];
    let sum = 0;
    const defaultWidth = 1 / columnCount;

    for (let i = 0; i < columnCount; ++i) {
        const key = CellPosition.stringifyColumnIndex(i);
        let width = defaultWidth;
        if (key) {
            const style = columnStyles.get(key);
            if (style && typeof style.width === "number" && width > 0) {
                width = Math.min(1, style.width);
            }
        }
        relative.push(width);
        sum += width;
    }

    const clamped = relative.map(value => (value / sum * 100).toFixed(2));
    clamped[0] = (100 - clamped.slice(1).reduce((p, c) => p + parseFloat(c), 0)).toFixed(2);

    return clamped.map(value => `${value}%`);
}
