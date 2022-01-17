import { FlowContent, FlowRange, FlowRangeSelection } from "../src";

describe("When a para break is deleted", () => {
    describe("by range", () => {
        const _runTest = (backward: boolean) => it("the style in the target paragraph is kept", () => {
            const before = FlowContent.fromJsonValue([
                "foo delete",
                { break: "para", style: { variant: "title" } },
                "this bar",
                { break: "para", style: { variant: "subtitle" } },
            ]);
            const selection = new FlowRangeSelection({ range: backward ? FlowRange.at(16, -13) : FlowRange.at(3, 13) });
            const op = selection.remove({ target: before });
            const after = op?.applyToContent(before);
            expect(after?.toJsonValue()).toMatchObject([
                "foobar",
                { break: "para", style: { variant: "title" } },
            ]);
        });
        describe("backward", () => _runTest(true));
        describe("forward", () => _runTest(false));
    });

    describe("by insertion", () => {
        const _runTest = (backward: boolean) => it("the style in the target paragraph is kept", () => {
            const before = FlowContent.fromJsonValue([
                "foo delete",
                { break: "para", style: { variant: "title" } },
                "this bar",
                { break: "para", style: { variant: "subtitle" } },
            ]);
            const selection = new FlowRangeSelection({ range: backward ? FlowRange.at(16, -13) : FlowRange.at(3, 13) });
            const op = selection.insert(FlowContent.fromJsonValue([" "]), { target: before });
            const after = op?.applyToContent(before);
            expect(after?.toJsonValue()).toMatchObject([
                "foo bar",
                { break: "para", style: { variant: "title" } },
            ]);
        });
        describe("backward", () => _runTest(true));
        describe("forward", () => _runTest(false));
    });

    describe("by caret", () => {
        const _runTest = (backward: boolean) => it("the style in the target paragraph is kept", () => {
            const before = FlowContent.fromJsonValue([
                "foo",
                { break: "para", style: { variant: "title" } },
                "bar",
                { break: "para", style: { variant: "subtitle" } },
            ]);
            const selection = new FlowRangeSelection({ range: backward ? FlowRange.at(4) : FlowRange.at(3) });
            const op = selection.remove({
                target: before,
                whenCollapsed: backward ? "removeBackward" : "removeForward"
            });
            const after = op?.applyToContent(before);
            expect(after?.toJsonValue()).toMatchObject([
                "foobar",
                { break: "para", style: { variant: "title" } },
            ]);
        });
        describe("backward", () => _runTest(true));
        describe("forward", () => _runTest(false));
    });
});
