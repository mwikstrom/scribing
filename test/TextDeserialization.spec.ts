import { deserializeFlowContentFromText } from "../src";

describe("TextDeserialization", () => {
    it("Can convert simple text", () => {
        const input = "hello world";
        const expected = ["hello world"];
        const actual = deserializeFlowContentFromText(input).toJsonValue();
        expect(actual).toEqual(expected);
    });

    it("Can convert line break", () => {
        const input = "hello\nworld";
        const expected = ["hello", { break: "line" }, "world"];
        const actual = deserializeFlowContentFromText(input).toJsonValue();
        expect(actual).toEqual(expected);
    });

    it("Can convert paragraph break", () => {
        const input = "hello\n\nworld";
        const expected = ["hello", { break: "para" }, "world"];
        const actual = deserializeFlowContentFromText(input).toJsonValue();
        expect(actual).toEqual(expected);
    });

    it("Can convert paragraph break", () => {
        const input = "hello\n\n\nworld\n\n";
        const expected = ["hello", { break: "para" }, { break: "line" }, "world", { break: "para" }];
        const actual = deserializeFlowContentFromText(input).toJsonValue();
        expect(actual).toEqual(expected);
    });

    it("Converts tabs to space", () => {
        const input = "hello\tworld";
        const expected = ["hello world"];
        const actual = deserializeFlowContentFromText(input).toJsonValue();
        expect(actual).toEqual(expected);
    });

    it("Replaces unsupported characters", () => {
        const input = "hello\0world";
        const expected = ["hello�world"];
        const actual = deserializeFlowContentFromText(input).toJsonValue();
        expect(actual).toEqual(expected);
    });
});
