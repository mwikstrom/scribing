<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FormatParagraph](./scribing.formatparagraph.md)

## FormatParagraph class

Represents an operation that applies a paragraph style to a range of flow content.

<b>Signature:</b>

```typescript
/** @sealed */
export declare class FormatParagraph extends FormatParagraphBase implements Readonly<FormatParagraphProps> 
```
<b>Extends:</b> FormatParagraphBase

<b>Implements:</b> Readonly&lt;[FormatParagraphProps](./scribing.formatparagraphprops.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.formatparagraph.classtype.md) | <code>static</code> | import("paratype").Type&lt;[FormatParagraph](./scribing.formatparagraph.md)<!-- -->&gt; | The run-time type that represents this class |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertFlow(other)](./scribing.formatparagraph.afterinsertflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was inserted. |
|  [afterRemoveFlow(other)](./scribing.formatparagraph.afterremoveflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was removed. |
|  [applyToContent(content, theme)](./scribing.formatparagraph.applytocontent.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [applyToSelection(selection)](./scribing.formatparagraph.applytoselection.md) |  | Applies the current operation on the specified selection and returns the updated result. |
|  [fromData(data)](./scribing.formatparagraph.fromdata.md) | <code>static</code> | Gets an instance of the current class from the specified data |
|  [invert(content)](./scribing.formatparagraph.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [mergeNext(next)](./scribing.formatparagraph.mergenext.md) |  | Returns an operation that keeps the intention of the current operation and the specified subsequent operation as they were performed as an atomic operation. |
|  [transform(other)](./scribing.formatparagraph.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |

