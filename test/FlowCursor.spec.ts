import seedrandom from "seedrandom";
import { JsonArray } from "paratype";
import { FlowContent, FlowCursor } from "../src";

describe("FlowCursor", () => {
    const data: JsonArray = [            
        { text: "Hello ", style: { italic: true } },
        { text: "world", style: { underline: true } },
        "!",
        { break: "para", style: { alignment: "center", type: "normal"} },
        "This is ",
        { text: "normal", style: { bold: true } },
        " text",
    ];

    describe("move", () => {
        const rng = seedrandom("1337");
        const content = FlowContent.classType.fromJsonValue(data);
        const positions = [...new Array(100)].map(() => Math.round(rng() * content.size));
        positions.forEach((to, i) => {
            const from = i > 0 ? positions[i - 1] : 0;
            const distance = to - from;
            it(`can move from ${from} to ${to} (distance=${distance})`, () => {
                const prev = content.peek(from);
                expect(prev.position).toBe(from);
                const result = prev.move(distance);
                expect(result.position).toBe(to);
                const index: number = (
                    to < "Hello ".length ? 0 :
                        to < "Hello world".length ? 1 :
                            to < "Hello world!".length ? 2 :
                                to < "Hello world!\n".length ? 3 :
                                    to < "Hello world!\nThis is ".length ? 4 : 
                                        to < "Hello world!\nThis is normal".length ? 5 : 6
                );
                expect(result.index).toBe(index);
            });
        });
    });

    it("validates ctor arg", () => {
        expect(() => new FlowCursor("bad" as unknown as FlowContent)).toThrow(
            "new FlowCursor(...): Invalid argument: Must be an instance of FlowContent"
        );
    });

    it("can interrogate empty content", () => {
        const content = FlowContent.classType.fromJsonValue([]);
        const cursor = new FlowCursor(content);
        
        expect(cursor.position).toBe(0);
        expect(cursor.node).toBe(null);
        expect(cursor.offset).toBe(0);
        expect(Array.from(cursor.before).length).toBe(0);
        expect(Array.from(cursor.after).length).toBe(0);
        expect(cursor.move(0)).toBe(cursor);
        expect(Array.from(cursor.range(0)).length).toBe(0);

        expect(() => cursor.move(-1)).toThrow("Invalid flow position");
        expect(() => cursor.move(1)).toThrow("Invalid flow position");
    });

    it("can interrogate cursor inside content", () => {
        const content = FlowContent.classType.fromJsonValue(data);
        const position = "hello world!\nThis i".length;
        const cursor = new FlowCursor(content).move(position);

        expect(cursor.position).toBe(position);
        expect(cursor.node?.toData()).toBe("This is ");
        expect(cursor.offset).toBe("This i".length);
        
        expect(Array.from(cursor.before).map(node => node.toJsonValue())).toMatchObject([
            { text: "Hello ", style: { italic: true } },
            { text: "world", style: { underline: true } },
            "!",
            { break: "para", style: { alignment: "center", type: "normal"} },
            "This i",
        ]);

        expect(Array.from(cursor.after).map(node => node.toJsonValue())).toMatchObject([
            "s ",
            { text: "normal", style: { bold: true } },
            " text",
        ]);
    });
});