import { FlowContent, FlowRange, FormatText, ParagraphBreak, TextRun, TextStyle } from "../src";

describe("FormatText", () => {
    it("can do and undo", () => {
        const original = FlowContent.fromData([
            TextRun.fromData("hello there "),
            TextRun.fromData({ text: "world", style: new TextStyle({ italic: true })}),
            new ParagraphBreak(),
            TextRun.fromData({ text: "the end", style: new TextStyle({ bold: true })}),
        ]);

        const op = new FormatText({
            range: FlowRange.at("hello ".length, "there world\nthe".length),
            style: new TextStyle({ underline: true, bold: true }),
        });

        const inv = op.invert(original);
        const done = op.applyTo(original);

        expect(done.toJsonValue()).toMatchObject([
            "hello ",
            { text: "there ", style: { underline: true, bold: true } },
            { text: "world", style: { underline: true, bold: true, italic: true } },
            { break: "para"},
            { text: "the", style: { underline: true, bold: true } },
            { text: " end", style: { bold: true } },
        ]);

        const undone = inv?.applyTo(done);

        expect(undone?.toJsonValue()).toMatchObject([
            "hello there ",
            { text: "world", style: { italic: true } },
            { break: "para"},
            { text: "the end", style: { bold: true } },
        ]);
    });
});