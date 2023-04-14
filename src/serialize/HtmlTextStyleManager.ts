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
    }

    public leave(): void {
    }
}
