import { FlowContent, FlowRange, InsertContent, ParagraphBreak, ParagraphStyle, TextRun, TextStyle } from "../src";

describe("InsertContent", () => {
    it("is not affected by other empty insertion", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterInsertion(FlowRange.at(100));
        expect(after).toBe(before);
    });

    it("is not affected by other insertion at later position", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterInsertion(FlowRange.at(200, 10));
        expect(after).toBe(before);
    });

    it("is translated by other insertion at same position", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterInsertion(FlowRange.at(123, 10));
        expect(after?.toJsonValue()).toMatchObject({
            insert: ["foobar"],
            at: 133,
        });
    });

    it("is translated by other insertion at earlier position", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterInsertion(FlowRange.at(100, 10));
        expect(after?.toJsonValue()).toMatchObject({
            insert: ["foobar"],
            at: 133,
        });
    });

    it("is not affected by empty removal", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterRemoval(FlowRange.at(100));
        expect(after).toBe(before);
    });

    it("is not affected by removal at later position", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterRemoval(FlowRange.at(200, 10));
        expect(after).toBe(before);
    });

    it("is not affected by removal at same position", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterRemoval(FlowRange.at(123, 10));
        expect(after).toBe(before);
    });

    it("is translated by removal at earlier position", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterRemoval(FlowRange.at(100, 10));
        expect(after?.toJsonValue()).toMatchObject({
            insert: ["foobar"],
            at: 113,
        });
    });

    it("is cancelled by removal that contains insertion position", () => {
        const before = InsertContent.fromData({
            insert: FlowContent.fromData([ TextRun.fromData("foobar") ]),
            at: 123,
        });
        const after = before.afterRemoval(FlowRange.at(122, 1));
        expect(after).toBeNull();
    });

    it("can be undone", () => {
        const original = FlowContent.fromData([TextRun.fromData("hello!")]);
        const op = InsertContent.fromData({
            insert: FlowContent.fromData([TextRun.fromData(" world")]),
            at: 5,
        });
        const inv = op.invert();
        const done = op.applyTo(original);
        expect(done.toJsonValue()).toMatchObject(["hello world!"]);
        const undone = inv?.applyTo(done);
        expect(undone?.toJsonValue()).toMatchObject(["hello!"]);
    });

    it("current paragraph style is kept when inserting", () => {
        const original = FlowContent.fromData([
            TextRun.fromData("ab"),
            new ParagraphBreak({ style: new ParagraphStyle({ alignment: "center" })}),
        ]);
        const op = InsertContent.fromData({ 
            insert: FlowContent.fromData([
                TextRun.fromData("X"),
                new ParagraphBreak(),
                TextRun.fromData("Y"),
                new ParagraphBreak(),
            ]), 
            at: 1 
        });
        const changed = op.applyTo(original);
        expect(changed.toJsonValue()).toMatchObject([
            "aX",
            { break: "para", style: { alignment: "center" }},
            "Y",
            { break: "para", style: { alignment: "center" }},
            "b",
            { break: "para", style: { alignment: "center" }},
        ]);
    });

    it("current text style is kept when inserting", () => {
        const original = FlowContent.fromData([TextRun.fromData({ text: "ab", style: new TextStyle({ bold: true })})]);
        const op = InsertContent.fromData({ insert: FlowContent.fromData([TextRun.fromData("X")]), at: 1 });
        const changed = op.applyTo(original);
        expect(changed.toJsonValue()).toMatchObject([
            { text: "aXb", style: { bold: true } }
        ]);
    });

    it("current text style is not kept after para-brak when inserting", () => {
        const original = FlowContent.fromData([TextRun.fromData({ text: "ab", style: new TextStyle({ bold: true })})]);
        const op = InsertContent.fromData({
            insert: FlowContent.fromData([
                TextRun.fromData("X"),
                new ParagraphBreak(),
                TextRun.fromData("Y"),
            ]), 
            at: 1 });
        const changed = op.applyTo(original);
        expect(changed.toJsonValue()).toMatchObject([
            { text: "aX", style: { bold: true } },
            { break: "para" },
            "Y",
            { text: "b", style: { bold: true } },
        ]);
    });
});
