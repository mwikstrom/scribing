import { Interaction, RunScript, Script } from "../src";

describe("RunScript", () => {
    it("can deserialize script code only", () => {
        const interaction = Interaction.fromJsonValue({
            script: "1+2",
        }) as RunScript;
        expect(interaction).toBeInstanceOf(RunScript);
        expect(interaction.script.code).toBe("1+2");
        expect(interaction.script.messages.size).toBe(0);
    });

    it("can deserialize script with message", () => {
        const interaction = Interaction.fromJsonValue({
            script: {
                code: "1+2",
                messages: {
                    foo: "bar",
                },
            },
        }) as RunScript;
        expect(interaction).toBeInstanceOf(RunScript);
        expect(interaction.script.code).toBe("1+2");
        expect(interaction.script.messages.size).toBe(1);
        expect(interaction.script.messages.get("foo")).toBe("bar");
    });

    it("can serialize script code only", () => {
        const interaction = new RunScript({
            script: new Script({
                code: "1+2",
                messages: Object.freeze(new Map()),
            }),
        });
        expect(interaction.toJsonValue()).toMatchObject({
            script: "1+2",
        });
    });

    it("can serialize script with message", () => {
        const interaction = new RunScript({
            script: new Script({
                code: "1+2",
                messages: Object.freeze(new Map().set("foo", "bar")),
            }),
        });
        expect(interaction.toJsonValue()).toMatchObject({
            script: {
                code: "1+2",
                messages: {
                    foo: "bar",
                },
            },
        });
    });
});