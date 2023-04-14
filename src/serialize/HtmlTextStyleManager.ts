import { TextStyle } from "../styles/TextStyle";
import { XmlWriter } from "./XmlWriter";

/** @internal */
export class HtmlTextStyleManager {
    readonly #writer: XmlWriter;
    #ambient: TextStyle;

    constructor(writer: XmlWriter, ambient: TextStyle) {
        this.#writer = writer;
        this.#ambient = ambient;
    }

    public apply(style: TextStyle): void {
        // TODO
    }

    public dispose(): void {
        // TODO
    }
}


const makeCssString = (props: Map<string, string>): string =>
    [...props].map(([key, value]) => `${key}:${value}`).join(";");
