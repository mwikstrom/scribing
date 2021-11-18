import { FlowRange, FlowSelection } from "../src";

describe("FlowSelection", () => {
    it("can replace inner selection", () => {
        // Caret is placed inside a box, inside a table (cell B2) at position 7.
        const before = FlowSelection.fromJsonValue({
            table: 7,
            cell: "B2",
            content: {
                box: 0,
                content: {
                    range: [0, 0],
                },
            },
        });
        // We're inserting a table and place caret inside cell A1 of that table
        let after: FlowSelection | null | undefined;
        before.visitRanges((range, {wrap}) => {
            if (range instanceof FlowRange && range.isCollapsed) {
                after = wrap(FlowSelection.fromJsonValue({
                    table: 0,
                    cell: "A1",
                    content: {
                        range: [0, 0],
                    },
                }));
            }
        });
        // Assert that we've got the expected selection.
        // Caret should now be:
        // - at the start of cell A1
        // - in a table at position 0 in a box
        // - which is at position 0 in cell B2
        // - in a table at position 7
        expect(after?.toJsonValue()).toMatchObject({
            table: 7,
            cell: "B2",
            content: {
                box: 0,
                content: {
                    table: 0,
                    cell: "A1",
                    content: {
                        range: [0, 0],
                    },
                },
            },
        });
    });
});