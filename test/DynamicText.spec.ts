import { DynamicText, FlowNode, Script, TextStyle } from "../src";

describe("DynamicText", () => {
    it("can deserialize script code only", () => {
        const node = FlowNode.fromJsonValue({
            dynamic: "1+2",
        }) as DynamicText;
        expect(node).toBeInstanceOf(DynamicText);
        expect(node.style.isEmpty).toBe(true);
        expect(node.expression.code).toBe("1+2");
        expect(node.expression.messages.size).toBe(0);
    });

    it("can deserialize script with message", () => {
        const node = FlowNode.fromJsonValue({
            dynamic: {
                code: "1+2",
                messages: {
                    foo: "bar",
                },
            },
        }) as DynamicText;
        expect(node).toBeInstanceOf(DynamicText);
        expect(node.style.isEmpty).toBe(true);
        expect(node.expression.code).toBe("1+2");
        expect(node.expression.messages.size).toBe(1);
        expect(node.expression.messages.get("foo")).toBe("bar");
    });

    it("can serialize script code only", () => {
        const node = new DynamicText({
            expression: new Script({
                code: "1+2",
                messages: Object.freeze(new Map()),
            }),
            style: TextStyle.empty,
        });
        expect(node.toJsonValue()).toMatchObject({
            dynamic: "1+2",
        });
    });

    it("can serialize script with message", () => {
        const node = new DynamicText({
            expression: new Script({
                code: "1+2",
                messages: Object.freeze(new Map().set("foo", "bar")),
            }),
            style: TextStyle.empty,
        });
        expect(node.toJsonValue()).toMatchObject({
            dynamic: {
                code: "1+2",
                messages: {
                    foo: "bar",
                },
            },
        });
    });
});