import { JsonObject } from "paratype";
import { FlowBatch, FlowContent, InsertContent } from "../src";

describe("Inserting plain text after formatted", () => {
    const before = FlowContent.fromJsonValue([
        "foo",
        { break: "para" },
    ]);

    const expected = FlowContent.fromJsonValue([
        "foo",
        { text: "bar!", style: { bold: true  } },
        { break: "para" },
    ]);

    const op1 = new InsertContent({
        position: 3,
        content: FlowContent.fromJsonValue([{ text: "bar", style: { bold: true } }]),
    });
    const op2 = new InsertContent({
        position: 6,
        content: FlowContent.fromJsonValue(["!"]),
    });

    it("can be done as two separate operations", () => {
        const intermediate = op1.applyToContent(before);
        const after = op2.applyToContent(intermediate);
        expect(after.toJsonValue()).toMatchObject(expected.toJsonValue() as JsonObject);
    });

    it("can be done as a single merged operation", () => {
        const merged = op1.mergeNext(op2);
        expect(merged).not.toBeNull();
        const after = merged?.applyToContent(before);
        expect(after?.toJsonValue()).toMatchObject(expected.toJsonValue() as JsonObject);
    });

    it("can be done as a batch operation", () => {
        const batch = FlowBatch.fromArray([op1, op2]);
        expect(batch).not.toBeNull();
        const after = batch?.applyToContent(before);
        expect(after?.toJsonValue()).toMatchObject(expected.toJsonValue() as JsonObject);
    });
});