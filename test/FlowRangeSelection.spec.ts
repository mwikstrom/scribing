import { DefaultFlowTheme, FlowContent, FlowRange, FlowRangeSelection } from "../src";

describe("FlowRangeSelection", () => {
    it("can insert over existing content", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foobar",
            { break: "para", style: { variant: "title" } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(2, 3),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "line" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "fo",
            { break: "line" },
            "r",
            { break: "para", style: { variant: "title" } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [3, 3],
        });
    });

    it("applies the next variant when inserting break at end of para", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foobar",
            { break: "para", style: { variant: "title" } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(6),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foobar",
            { break: "para", style: { variant: "title" } },
            { break: "para", style: { variant: "subtitle" } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [7, 7],
        });
    });

    it("applies the next variant when inserting break into empty para (title -> subtitle)", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            { break: "para", style: { variant: "title" } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(0),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            { break: "para", style: { variant: "subtitle" } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [0, 0],
        });
    });

    it("applies the next variant when inserting break into empty para (subtitle -> normal)", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            { break: "para", style: { variant: "subtitle" } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(0),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            { break: "para" },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [0, 0],
        });
    });

    it("splits para when the next variant is already set", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            { break: "para" },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(0),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            { break: "para" },
            { break: "para" },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [1, 1],
        });
    });

    it("unhides list marker when inserting para break into empty list item", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            { break: "para", style: { listLevel: 1, hideListMarker: true } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(0),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            { break: "para", style: { listLevel: 1 } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [0, 0],
        });
    });

    it("decreases list level when inserting para break into empty list item", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            { break: "para", style: { listLevel: 2 } }
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(0),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            { break: "para", style: { listLevel: 1 } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [0, 0],
        });
    });

    it("exits list when inserting para break into empty list item at level 1", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foo",
            { break: "para", style: { listLevel: 1 } },
            { break: "para", style: { listLevel: 1 } }
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(4),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foo",
            { break: "para", style: { listLevel: 1 } },
            { break: "para" },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [4, 4],
        });
    });

    it("keeps the counter reset in place when splitting a list item", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foobar",
            { break: "para", style: { listLevel: 1, listCounter: "reset" } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(3),
        });
        const operation = selectionBefore.insert(
            FlowContent.fromJsonValue([{ break: "para" }]),
            { theme, target: contentBefore }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foo",
            { break: "para", style: { listLevel: 1, listCounter: "reset" } },
            "bar",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [4, 4],
        });
    });

    it("hides list marker when deleting backward the start of a list item", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foo",
            { break: "para", style: { listLevel: 1 } },
            "bar",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(4),
        });
        const operation = selectionBefore.remove(
            { theme, target: contentBefore, whenCollapsed: "removeBackward" }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foo",
            { break: "para", style: { listLevel: 1 } },
            "bar",
            { break: "para", style: { listLevel: 1, hideListMarker: true } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [4, 4],
        });
    });

    it("keeps list marker when deleting backward the start of a list item with hidden marker", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foo",
            { break: "para", style: { listLevel: 1 } },
            "bar",
            { break: "para", style: { listLevel: 1, hideListMarker: true } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(4),
        });
        const operation = selectionBefore.remove(
            { theme, target: contentBefore, whenCollapsed: "removeBackward" }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foobar",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [3, 3],
        });
    });

    it("keeps paragraph style when deleting backward the start of paragraph", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foo",
            { break: "para", style: { listLevel: 5, hideListMarker: true, variant: "h1", alignment: "center" } },
            "bar",
            { break: "para", style: { variant: "h3", lineSpacing: 200 } },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(4),
        });
        const operation = selectionBefore.remove(
            { theme, target: contentBefore, whenCollapsed: "removeBackward" }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foobar",
            { break: "para", style: { listLevel: 5, hideListMarker: true, variant: "h1", alignment: "center" } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [3, 3],
        });
    });

    it("keeps paragraph style when deleting backward the start of a trailing paragraph", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foo",
            { break: "para", style: { listLevel: 5, hideListMarker: true, variant: "h1", alignment: "center" } },
            "bar",
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(4),
        });
        const operation = selectionBefore.remove(
            { theme, target: contentBefore, whenCollapsed: "removeBackward" }
        );
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foobar",
            { break: "para", style: { listLevel: 5, hideListMarker: true, variant: "h1", alignment: "center" } },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [3, 3],
        });
    });

    it("unsets list style when level reaches zero", () => {
        const theme = DefaultFlowTheme.instance;
        const contentBefore = FlowContent.fromJsonValue([
            "foo",
            { break: "para", style: { listLevel: 2, hideListMarker: true, variant: "h1", listMarker: "disc" } },
            "bar",
            { break: "para", style: { listLevel: 1, hideListMarker: true, variant: "h1", listMarker: "disc" } },
            "break",
            { break: "para" },
            "foo",
            { break: "para", style: { listLevel: 2, hideListMarker: true, variant: "h1", listMarker: "disc" } },
            "bar",
            { break: "para", style: { listLevel: 1, hideListMarker: true, variant: "h1", listMarker: "disc" } },
            "break",
            { break: "para" },
        ]);
        const selectionBefore = new FlowRangeSelection({
            range: FlowRange.at(0, contentBefore.size),
        });
        const operation = selectionBefore.decrementListLevel(contentBefore);
        const contentAfter = operation?.applyToContent(contentBefore, theme);
        expect(contentAfter?.toJsonValue()).toMatchObject([
            "foo",
            { break: "para", style: { listLevel: 1, hideListMarker: true, variant: "h1", listMarker: "disc" } },
            "bar",
            { break: "para", style: { variant: "h1" } },
            "break",
            { break: "para" },
            "foo",
            { break: "para", style: { listLevel: 1, hideListMarker: true, variant: "h1", listMarker: "disc" } },
            "bar",
            { break: "para", style: { variant: "h1" } },
            "break",
            { break: "para" },
        ]);
        const selectionAfter = operation?.applyToSelection(selectionBefore, true);
        expect(selectionAfter?.toJsonValue()).toMatchObject({
            range: [0, contentBefore.size],
        });
    });
});