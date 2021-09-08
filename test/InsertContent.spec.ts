import { FlowContent, FlowRange, InsertContent, TextRun } from "../src";

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
});
