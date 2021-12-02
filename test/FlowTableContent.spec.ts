import { CellPosition, FlowTableCell, FlowTableContent } from "../src";

describe("FlowTableContent", () => {
    it("can merge cells", () => {
        const before = new FlowTableContent([["C3", FlowTableCell.emptyParagraph]]);    
        const after = before.merge(CellPosition.parse("B1", true), 1, 2);
        expect(after.rowCount).toBe(3);
        expect(after.columnCount).toBe(3);
        expect(after.positions.map(p => p.toString()).join(" ")).toBe("A1 B1 C1 A2 C2 A3 B3 C3");
    });
});