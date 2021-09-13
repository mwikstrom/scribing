import { FlowBatch, FlowContent, FlowRange, InsertContent, RemoveRange, TextRun } from "../src";

describe("FlowBatch", () => {
    it("can be empty", () => {
        expect(new FlowBatch().operations.length).toBe(0);
    });
    it("can be nested", () => {
        const outer = FlowBatch.fromData([new FlowBatch()]);
        expect(outer.operations.length).toBe(1);
        expect(outer.operations[0]).toBeInstanceOf(FlowBatch);
        expect(FlowBatch.classType.toJsonValue(outer)).toMatchObject([[]]);
    });

    it("can be undone", () => {
        const original = FlowContent.fromData([TextRun.fromData("hello there!")]);
        const op = FlowBatch.fromData([
            RemoveRange.fromData({ remove: FlowRange.fromData([2, 9])}),
            InsertContent.fromData({ insert: FlowContent.fromData([TextRun.fromData("j dä")]), at: 2 }),
            RemoveRange.fromData({ remove: FlowRange.fromData([7, 8])}),
        ]);
        const inv = op.invert(original);
        const done = op.applyToContent(original);
        expect(done.toJsonValue()).toMatchObject(["hej där!"]);
        const undone = inv?.applyToContent(done);
        expect(undone?.toJsonValue()).toMatchObject(["hello there!"]);
    });

    it("can be transformed", () => {
        const original = FlowContent.fromData([TextRun.fromData("hello there!")]);
        const batch1 = FlowBatch.fromData([
            RemoveRange.fromData({ remove: FlowRange.fromData([0, 1])}),
            InsertContent.fromData({ insert: FlowContent.fromData([TextRun.fromData("H")]), at: 0 }),
            InsertContent.fromData({ insert: FlowContent.fromData([TextRun.fromData("?")]), at: 11 }),
        ]);
        const batch2 = FlowBatch.fromData([
            RemoveRange.fromData({ remove: FlowRange.fromData([2, 9])}),
            InsertContent.fromData({ insert: FlowContent.fromData([TextRun.fromData("j dä")]), at: 2 }),
            RemoveRange.fromData({ remove: FlowRange.fromData([7, 8])}),
        ]);

        const result1 = batch1.applyToContent(original);
        const result2 = batch2.applyToContent(original);

        expect(result1?.toJsonValue()).toMatchObject(["Hello there?!"]);
        expect(result2?.toJsonValue()).toMatchObject(["hej där!"]);

        const transformedBatch = batch1.transform(batch2);
        const transformedResult = transformedBatch?.applyToContent(result1);
        expect(transformedResult?.toJsonValue()).toMatchObject(["Hej där?!"]);
    });
});