import { FlowContent, FlowRange, RemoveRange, TextRun } from "../src";

describe("RemoveRange", () => {
    it("is not affected by empty insertion", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterInsertion(FlowRange.at(100));
        expect(after).toBe(before);
    });

    it("is not affected by insertion at later position", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterInsertion(FlowRange.at(200, 10));
        expect(after).toBe(before);
    });

    it("is translated by insertion at same position", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterInsertion(FlowRange.at(123, 10));
        expect(after?.toJsonValue()).toMatchObject({ remove: [133, 143] });
    });

    it("is translated by insertion at earlier position", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterInsertion(FlowRange.at(100, 10));
        expect(after?.toJsonValue()).toMatchObject({ remove: [133, 143] });
    });

    it("is inflated by insertion inside", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterInsertion(FlowRange.at(130, 10));
        expect(after?.toJsonValue()).toMatchObject({ remove: [123, 143] });
    });

    it("is not affected by empty insertion inside", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterInsertion(FlowRange.at(130, 0));
        expect(after).toBe(before);
    });

    it("is not affected by other empty removal", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(100));
        expect(after).toBe(before);
    });

    it("is not affected by other removal at later position", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(200, 10));
        expect(after).toBe(before);
    });

    it("is deflated by other removal at same position", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(123, 4));
        expect(after?.toJsonValue()).toMatchObject({ remove: [123, 129] });
    });

    it("is translated by other removal at earlier position", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(100, 10));
        expect(after?.toJsonValue()).toMatchObject({ remove: [113, 123] });
    });

    it("is deflated by other removal inside", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(125, 5));
        expect(after?.toJsonValue()).toMatchObject({ remove: [123, 128] });
    });

    it("is translated and deflated by other removal that contains start", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(120, 5));
        expect(after?.toJsonValue()).toMatchObject({ remove: [120, 128] });
    });

    it("is deflated by other removal that contains end", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(130, 5));
        expect(after?.toJsonValue()).toMatchObject({ remove: [123, 130] });
    });

    it("is cancelled by other removal of the same range", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(123, 10));
        expect(after).toBeNull();
    });

    it("is cancelled by other removal that covers the range", () => {
        const before = RemoveRange.fromData({ remove: FlowRange.at(123, 10) });
        const after = before.afterRemoval(FlowRange.at(120, 15));
        expect(after).toBeNull();
    });

    it("can be undone", () => {
        const original = FlowContent.fromData([TextRun.fromData("hello world!")]);
        const op = RemoveRange.fromData({remove: FlowRange.fromData([5, 11])});
        const inv = op.invert(original);
        const done = op.applyToContent(original);
        expect(done.toJsonValue()).toMatchObject(["hello!"]);
        const undone = inv?.applyToContent(done);
        expect(undone?.toJsonValue()).toMatchObject(["hello world!"]);
    });
});
