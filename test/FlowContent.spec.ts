import { FlowContent, FlowRange, ParagraphStyle, TextRun, TextStyle } from "../src";

describe("FlowContent", () => {
    it("can copy partial text run", () => {
        const content = FlowContent.classType.fromJsonValue(["foobar"]);
        const nodes = content.copy(FlowRange.at(2, 3));
        expect(nodes.map(n => n.toJsonValue())).toMatchObject(["oba"]);
    });

    it("can copy cross text runs", () => {
        const content = FlowContent.classType.fromJsonValue([
            "foo", 
            { text: "bar", style: { bold: true }}
        ]);
        const nodes = content.copy(FlowRange.at(2, 3));
        expect(nodes.map(n => n.toJsonValue())).toMatchObject([
            "o", 
            { text: "ba", style: { bold: true }}
        ]);
    });

    it("can copy first text run", () => {
        const content = FlowContent.classType.fromJsonValue([
            "foo", 
            { text: "bar", style: { bold: true }}
        ]);
        const nodes = content.copy(FlowRange.at(0, 3));
        expect(nodes.map(n => n.toJsonValue())).toMatchObject([
            "foo", 
        ]);
    });

    it("can copy second text run", () => {
        const content = FlowContent.classType.fromJsonValue([
            "foo", 
            { text: "bar", style: { bold: true }}
        ]);
        const nodes = content.copy(FlowRange.at(3, 3));
        expect(nodes.map(n => n.toJsonValue())).toMatchObject([
            { text: "bar", style: { bold: true }}
        ]);
    });

    it("won't format partial paragraph", () => {
        const content = FlowContent.classType.fromJsonValue([
            "foo", { break: "para" }, "bar",
        ]).formatParagraph(FlowRange.at(1, 2), ParagraphStyle.classType.fromJsonValue({
            type: "title"
        }));
        expect(FlowContent.classType.toJsonValue(content)).toMatchObject([
            "foo", { break: "para" }, "bar",
        ]);
    });

    it("can format paragraph", () => {
        const content = FlowContent.classType.fromJsonValue([
            "foo", { break: "para" }, "bar",
        ]).formatParagraph(FlowRange.at(3, 1), new ParagraphStyle({ type: "title" }));
        expect(FlowContent.classType.toJsonValue(content)).toMatchObject([
            "foo", { break: "para", style: { type: "title"} }, "bar",
        ]);
    });

    it("can format inner text", () => {
        const content = FlowContent.classType.fromJsonValue([
            "fo", { text: "ob", style: { bold: true } }, "ar",
        ]).formatText(FlowRange.at(1, 4), new TextStyle({ italic: true }));
        expect(FlowContent.classType.toJsonValue(content)).toMatchObject([
            "f",
            { text: "o", style: { italic: true } },
            { text: "ob", style: { italic: true, bold: true } },
            { text: "a", style: { italic: true } },
            "r",
        ]);
    });

    it("can insert text", () => {
        const content = new FlowContent()
            .insert(0, TextRun.fromData("ba"))
            .insert(0, TextRun.fromData("fo"))
            .insert(2, TextRun.fromData("o"))
            .append(TextRun.fromData("r"));
        expect(FlowContent.classType.toJsonValue(content)).toMatchObject(["foobar"]);
    });
});