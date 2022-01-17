import { FlowContent, FlowRange, FlowRangeSelection } from "../src";

describe("When a para break is inserted to split a list item with counter reset", () => {
    it("results in the first list item having the reset and the second being a continuation", () => {
        const before = FlowContent.fromJsonValue([
            "First",
            { break: "para", style: { listLevel: 1, listMarker: "ordered", listCounter: "reset" } },
        ]);
        const selection = new FlowRangeSelection({ range: FlowRange.at(5) });
        const op = selection.insert(FlowContent.fromJsonValue([
            { break: "para" },
            "Second"
        ]));
        const after = op?.applyToContent(before);
        expect(after?.toJsonValue()).toMatchObject([
            "First",
            { break: "para", style: { listLevel: 1, listMarker: "ordered", listCounter: "reset" } },
            "Second",
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } },
        ]);
    });
});
