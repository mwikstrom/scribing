import { FlowContent, MarkupHandler, MarkupReplacementRegistration, processMarkup } from "../src";

describe("transclusion", () => {
    test("insert plain text into plain text", async () => {
        const input = FlowContent.fromJsonValue(["before ", { empty_markup: "plain" }, " after" ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual(["before foobar after"]);
    });

    test("insert paragraph into plain text", async () => {
        const input = FlowContent.fromJsonValue(["before ", { empty_markup: "para" }, " after" ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual(["before foobar", { break: "para" }, " after"]);
    });

    test("insert plain text into paragraph", async () => {
        const input = FlowContent.fromJsonValue(["before ", { empty_markup: "plain" }, " after", { break: "para" } ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual(["before foobar after", { break: "para" }]);
    });

    test("insert paragraph into paragraph", async () => {
        const input = FlowContent.fromJsonValue(["before ", { empty_markup: "para" }, " after", { break: "para" } ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual(["before foobar", { break: "para" }, " after", { break: "para" }]);
    });

    test("insert paragraph into heading", async () => {
        const input = FlowContent.fromJsonValue([
            "before ",
            { empty_markup: "para" },
            " after",
            { break: "para", style: { variant: "h1" } }
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before foobar",
            { break: "para"},
            " after",
            { break: "para", style: { variant: "h1" } }
        ]);
    });

    test("insert heading into paragraph", async () => {
        const input = FlowContent.fromJsonValue([
            "before ",
            { empty_markup: "h1" },
            " after",
            { break: "para" }
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before foobar",
            { break: "para", style: { variant: "h1" } },
            " after",
            { break: "para"}
        ]);
    });

    test("insert paragraph into bullet list", async () => {
        const input = FlowContent.fromJsonValue([
            "before",
            { break: "para", style: { listLevel: 1 } },
            { empty_markup: "para" },
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before",
            { break: "para", style: { listLevel: 1 } },
            "foobar",
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
    });

    test("insert paragraph into start of non-empty bullet list item", async () => {
        const input = FlowContent.fromJsonValue([
            "before",
            { break: "para", style: { listLevel: 1 } },
            { empty_markup: "para" },
            "post",
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before",
            { break: "para", style: { listLevel: 1 } },
            "foobar",
            { break: "para", style: { listLevel: 1 } },
            "post",
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
    });

    test("insert paragraph into end of non-empty bullet list item", async () => {
        const input = FlowContent.fromJsonValue([
            "before",
            { break: "para", style: { listLevel: 1 } },
            "pre",
            { empty_markup: "para" },
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before",
            { break: "para", style: { listLevel: 1 } },
            "prefoobar",
            { break: "para" },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
    });

    test("insert paragraph into middle of non-empty bullet list item", async () => {
        const input = FlowContent.fromJsonValue([
            "before",
            { break: "para", style: { listLevel: 1 } },
            "pre",
            { empty_markup: "para" },
            "post",
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before",
            { break: "para", style: { listLevel: 1 } },
            "prefoobar",
            { break: "para" },
            "post",
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
    });

    test("insert two paragraphs into bullet list", async () => {
        const input = FlowContent.fromJsonValue([
            "before",
            { break: "para", style: { listLevel: 1 } },
            { empty_markup: "two-paras" },
            { break: "para", style: { listLevel: 1 } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before",
            { break: "para", style: { listLevel: 1 } },
            "foo",
            { break: "para", style: { listLevel: 1 } },
            "bar",
            { break: "para", style: { listLevel: 1, hideListMarker: true } },
            "after",
            { break: "para", style: { listLevel: 1 } },
        ]);
    });

    test("insert two paragraphs into numbered list", async () => {
        const input = FlowContent.fromJsonValue([
            "before",
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } },
            { empty_markup: "two-paras" },
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } },
            "after",
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } },
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before",
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } },
            "foo",
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } },
            "bar",
            { break: "para", style: { listLevel: 1, listMarker: "ordered", hideListMarker: true } },
            "after",
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } },
        ]);
    });

    test("insert ordered list into bullet list", async () => {
        const input = FlowContent.fromJsonValue([
            "before",
            { break: "para", style: { listLevel: 1, listMarker: "unordered" } },
            { empty_markup: "ol" },
            { break: "para", style: { listLevel: 1, listMarker: "unordered" } },
            "after",
            { break: "para", style: { listLevel: 1, listMarker: "unordered" } },
        ]);
        const output = await processMarkup(input, handler, noop);
        expect(output.toJsonValue()).toEqual([
            "before",
            { break: "para", style: { listLevel: 1, listMarker: "unordered" } },
            "first",
            { break: "para", style: { listLevel: 2, listMarker: "ordered" } },
            "cont'd",
            { break: "para", style: { listLevel: 2, listMarker: "ordered", hideListMarker: true } },
            "second",
            { break: "para", style: { listLevel: 2, listMarker: "ordered" } },
            "after",
            { break: "para", style: { listLevel: 1, listMarker: "unordered" } },
        ]);
    });
});

const handler: MarkupHandler<unknown> = async input => {
    if (input.node.tag === "plain") {
        return FlowContent.fromJsonValue(["foobar"]);
    } else if (input.node.tag === "para") {
        return FlowContent.fromJsonValue(["foobar", { break: "para" }]);
    } else if (input.node.tag === "h1") {
        return FlowContent.fromJsonValue(["foobar", { break: "para", style: { variant: "h1" } }]);
    } else if (input.node.tag === "two-paras") {
        return FlowContent.fromJsonValue(["foo", { break: "para" }, "bar", { break: "para" }]);
    } else if (input.node.tag === "ol") {
        return FlowContent.fromJsonValue([
            "first", 
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } }, 
            "cont'd", 
            { break: "para", style: { listLevel: 1, listMarker: "ordered", hideListMarker: true } }, 
            "second", 
            { break: "para", style: { listLevel: 1, listMarker: "ordered" } }
        ]);
    }
};

const noop: MarkupReplacementRegistration<unknown> = () => void 0;
