import { CellPosition, FlowContent, FlowSelection, FlowTableCell } from "../src";
import { FlowTable } from "../src/nodes/FlowTable";

describe("FlowTable", () => {
    it("can insert into sparse cell", () => {
        // Setup sparse table
        const flowBefore = FlowContent.fromJsonValue([{
            table: {
                "C5": [{ break: "para"}],
                "default": [{ break: "para"}],
            }
        }]);

        // Check initial content
        const tableBefore = flowBefore.nodes[0] as FlowTable;
        expect(tableBefore).toBeInstanceOf(FlowTable);
        expect(tableBefore.content.columnCount).toBe(3);
        expect(tableBefore.content.rowCount).toBe(5);
        expect(
            FlowTableCell.classType.toJsonValue(tableBefore.content.getCell(CellPosition.parse("A1", true), true))
        ).toMatchObject([{break: "para"}]);

        // Insert content
        const selection = FlowSelection.fromJsonValue({
            table: 0,
            cell: "A1",
            content: { range: [0,0] },
        });
        const op = selection.insert(FlowContent.fromJsonValue(["foo"]));
        const flowAfter = op?.applyToContent(flowBefore);
        
        // Check resulting content
        const tableAfter = flowAfter?.nodes[0] as FlowTable;
        expect(tableAfter).toBeInstanceOf(FlowTable);
        expect(tableAfter.content.columnCount).toBe(3);
        expect(tableAfter.content.rowCount).toBe(5);
        expect(
            FlowTableCell.classType.toJsonValue(tableAfter.content.getCell(CellPosition.parse("A1", true), true))
        ).toMatchObject(["foo", {break: "para"}]);
    });
});