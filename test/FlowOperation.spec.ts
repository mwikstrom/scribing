import { FlowBatch, FlowOperation, InsertContent, RemoveRange } from "../src";
import { FormatText } from "../src/FormatText";

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
});