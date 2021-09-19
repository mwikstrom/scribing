import seedrandom from "seedrandom";
import { JsonArray } from "paratype";
import { FlowContent, FlowCursor } from "../src";

describe("FlowCursor", () => {
    const data: JsonArray = [            
        { text: "Hello ", style: { italic: true } },
        { text: "world", style: { underline: true } },
        "!",
        { break: "para", style: { alignment: "center", variant: "normal"} },
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

    it("can move to start of node", () => {
        const content = FlowContent.classType.fromJsonValue(data);
        
        const p1 = content.peek(19);
        expect(p1.position).toBe(19);
        expect(p1.index).toBe(4);
        expect(p1.offset).toBe(6);

        const p2 = p1.moveToStartOfNode();
        expect(p2.position).toBe(13);
        expect(p2.index).toBe(4);
        expect(p2.offset).toBe(0);
    });

    it("can move to start of prev node", () => {
        const content = FlowContent.classType.fromJsonValue(data);
        
        const p1 = content.peek(19);
        expect(p1.position).toBe(19);
        expect(p1.index).toBe(4);
        expect(p1.offset).toBe(6);

        const p2 = p1.moveToStartOfPreviousNode();
        expect(p2?.position).toBe(12);
        expect(p2?.index).toBe(3);
        expect(p2?.offset).toBe(0);

        const p3 = p2?.moveToStartOfPreviousNode();
        expect(p3?.position).toBe(11);
        expect(p3?.index).toBe(2);
        expect(p3?.offset).toBe(0);

        const p4 = p3?.moveToStartOfPreviousNode();
        expect(p4?.position).toBe(6);
        expect(p4?.index).toBe(1);
        expect(p4?.offset).toBe(0);

        const p5 = p4?.moveToStartOfPreviousNode();
        expect(p5?.position).toBe(0);
        expect(p5?.index).toBe(0);
        expect(p5?.offset).toBe(0);

        const p6 = p5?.moveToStartOfPreviousNode();
        expect(p6).toBeNull();
    });

    it("can move to start of next node", () => {
        const content = FlowContent.classType.fromJsonValue(data);
        
        const p1 = content.peek(19);
        expect(p1.position).toBe(19);
        expect(p1.index).toBe(4);
        expect(p1.offset).toBe(6);

        const p2 = p1.moveToStartOfNextNode();
        expect(p2?.position).toBe(21);
        expect(p2?.index).toBe(5);
        expect(p2?.offset).toBe(0);

        const p3 = p2?.moveToStartOfNextNode();
        expect(p3?.position).toBe(27);
        expect(p3?.index).toBe(6);
        expect(p3?.offset).toBe(0);

        const p4 = p3?.moveToStartOfNextNode();
        expect(p4).toBeNull();
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
            { break: "para", style: { alignment: "center", variant: "normal"} },
            "This i",
        ]);

        expect(Array.from(cursor.after).map(node => node.toJsonValue())).toMatchObject([
            "s ",
            { text: "normal", style: { bold: true } },
            " text",
        ]);
    });

    it("can get paragraph style", () => {
        const content = FlowContent.classType.fromJsonValue(data);
        expect(content.peek(0).getParagraphStyle()?.toData()).toMatchObject({
            alignment: "center",
            variant: "normal"
        });
        expect(content.peek(10).getParagraphStyle()?.toData()).toMatchObject({
            alignment: "center",
            variant: "normal"
        });
        expect(content.peek(12).getParagraphStyle()?.toData()).toMatchObject({
            alignment: "center",
            variant: "normal"
        });
        expect(content.peek(13).getParagraphStyle()).toBe(null);
        expect(content.peek(20).getParagraphStyle()).toBe(null);
    });

    it("can get text style", () => {
        const content = FlowContent.classType.fromJsonValue(data);
        expect(content.peek(0).getTextStyle()?.toData()).toMatchObject({ italic: true });
        expect(content.peek(10).getTextStyle()?.toData()).toMatchObject({ underline: true });
        expect(content.peek(12).getTextStyle()?.toData()).toMatchObject({});
        expect(content.peek(13).getTextStyle()?.toData()).toMatchObject({});
    });

    it("can get before/after ranges after single para break", () => {
        const content = FlowContent.fromJsonValue([
            { break: "para" }
        ]);
        const cursor = content.peek(1);
        const before = Array.from(cursor.before);
        const after = Array.from(cursor.after);
        expect(before.length).toBe(1);
        expect(after.length).toBe(0);
    });

    it("can get before/after ranges before single para break", () => {
        const content = FlowContent.fromJsonValue([
            { break: "para" }
        ]);
        const cursor = content.peek(0);
        const before = Array.from(cursor.before);
        const after = Array.from(cursor.after);
        expect(before.length).toBe(0);
        expect(after.length).toBe(1);
    });
});