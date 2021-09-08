import { 
    FlowBatch,
    FlowOperation, 
    FormatParagraph, 
    FormatText, 
    InsertContent, 
    RemoveRange, 
    UnformatParagraph, 
    UnformatText 
} from "../src";

describe("FlowOperation", () => {
    it("can deserialize insert content operation", () => {
        const op = FlowOperation.fromJsonValue({
            insert: ["foobar"],
            at: 123,
        }) as InsertContent;
        expect(op).toBeInstanceOf(InsertContent);
        expect(op.position).toBe(123);
        expect(op.content.nodes.length).toBe(1);
        expect(op.content.nodes[0].toData()).toBe("foobar");
    });

    it("can deserialize remove range operation", () => {
        const op = FlowOperation.fromJsonValue({
            remove: [123, 456],
        }) as RemoveRange;
        expect(op).toBeInstanceOf(RemoveRange);
        expect(op.range.anchor).toBe(123);
        expect(op.range.focus).toBe(456);
    });

    it("can deserialize batch operation", () => {
        const batch = FlowOperation.fromJsonValue([
            { remove: [123, 456] },
            { insert: ["foobar"], at: 123 },
        ]) as FlowBatch;
        
        expect(batch).toBeInstanceOf(FlowBatch);
        expect(batch.operations.length).toBe(2);

        const op1 = batch.operations[0] as RemoveRange;
        expect(op1).toBeInstanceOf(RemoveRange);
        expect(op1.range.anchor).toBe(123);
        expect(op1.range.focus).toBe(456);

        const op2 = batch.operations[1] as InsertContent;
        expect(op2).toBeInstanceOf(InsertContent);
        expect(op2.position).toBe(123);
        expect(op2.content.nodes.length).toBe(1);
        expect(op2.content.nodes[0].toData()).toBe("foobar");
    });

    it("can deserialize format text operation", () => {
        const op = FlowOperation.fromJsonValue({
            format: "text",
            range: [123, 456],
            style: { bold: true },
        }) as FormatText;
        expect(op).toBeInstanceOf(FormatText);
        expect(op.range.anchor).toBe(123);
        expect(op.range.focus).toBe(456);
        expect(op.style.toData()).toMatchObject({ bold: true });
    });

    it("can deserialize unformat text operation", () => {
        const op = FlowOperation.fromJsonValue({
            unformat: "text",
            range: [123, 456],
            style: { bold: true },
        }) as UnformatText;
        expect(op).toBeInstanceOf(UnformatText);
        expect(op.range.anchor).toBe(123);
        expect(op.range.focus).toBe(456);
        expect(op.style.toData()).toMatchObject({ bold: true });
    });

    it("can deserialize format paragraph operation", () => {
        const op = FlowOperation.fromJsonValue({
            format: "para",
            range: [123, 456],
            style: { type: "h1" },
        }) as FormatParagraph;
        expect(op).toBeInstanceOf(FormatParagraph);
        expect(op.range.anchor).toBe(123);
        expect(op.range.focus).toBe(456);
        expect(op.style.toData()).toMatchObject({ type: "h1" });
    });

    it("can deserialize unformat paragraph operation", () => {
        const op = FlowOperation.fromJsonValue({
            unformat: "para",
            range: [123, 456],
            style: { type: "h1" },
        }) as UnformatParagraph;
        expect(op).toBeInstanceOf(UnformatParagraph);
        expect(op.range.anchor).toBe(123);
        expect(op.range.focus).toBe(456);
        expect(op.style.toData()).toMatchObject({ type: "h1" });
    });});