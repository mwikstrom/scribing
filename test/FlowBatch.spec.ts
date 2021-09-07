import { FlowBatch } from "../src";

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
});