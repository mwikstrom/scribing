import { Element as XmlElem, Attributes as XmlAttr, js2xml } from "xml-js";

/**
 * @internal
 */
export type EndScopeFunc = () => void;

/**
 * @internal
 */
export class XmlWriter {
    #root: XmlElem[] = [];
    #stack: XmlElem[] = [];

    public toString(): string {
        return js2xml({ elements: this.#root }, {
            spaces: 4,
            attributeValueFn: val => val.replace(
                /\s/g, 
                ws => ws === " " ? ws : `&#x${ws.charCodeAt(0).toString(16).padStart(4, "0")};`
            ),
        });
    }

    public reset(): void {
        this.#stack = [];
        this.#root = [];
    }

    public start(name: string, attributes?: XmlAttr): EndScopeFunc {
        const elem: XmlElem = { type: "element", name, attributes };
        this.append(elem);
        this.#stack.push(elem);
        return () => {
            const popped = this.#stack.pop();
            if (popped !== elem) {
                throw new Error("Closing unexpected element");
            }
        };
    }

    public elem(name: string, attributes?: XmlAttr, children?: string | XmlElem[]): void {
        const end = this.start(name, attributes);

        if (typeof children === "string") {
            this.text(children);
        } else if (children) {
            this.append(...children);
        }

        end();
    }

    public text(value: string): void {
        this.append({ type: "text", text: value });
    }

    public append(...elements: XmlElem[]): void {
        const stackLength = this.#stack.length;
        if (stackLength > 0) {
            const parent = this.#stack[stackLength - 1];
            if (!parent.elements) {
                parent.elements = elements;
            } else {
                parent.elements.push(...elements);
            }
        } else {
            this.#root.push(...elements);
        }
    }
}