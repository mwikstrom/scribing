<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [UnformatParagraph](./scribing.unformatparagraph.md)

## UnformatParagraph class

Represents an operation that unapplies a paragraph style to a range of flow content.

**Signature:**

```typescript
/** @sealed */
export declare class UnformatParagraph extends UnformatParagraphBase implements Readonly<UnformatParagraphProps> 
```
**Extends:** UnformatParagraphBase

**Implements:** Readonly&lt;[UnformatParagraphProps](./scribing.unformatparagraphprops.md)<!-- -->&gt;

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.unformatparagraph.classtype.md) | <p><code>static</code></p><p><code>readonly</code></p> | import("paratype").Type&lt;[UnformatParagraph](./scribing.unformatparagraph.md)<!-- -->&gt; | The run-time type that represents this class |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertFlow(other)](./scribing.unformatparagraph.afterinsertflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was inserted. |
|  [afterRemoveFlow(other)](./scribing.unformatparagraph.afterremoveflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was removed. |
|  [applyToContent(content)](./scribing.unformatparagraph.applytocontent.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [applyToSelection(selection)](./scribing.unformatparagraph.applytoselection.md) |  | Applies the current operation on the specified selection and returns the updated result. |
|  [fromData(data)](./scribing.unformatparagraph.fromdata.md) | <code>static</code> | Gets an instance of the current class from the specified data |
|  [invert(content)](./scribing.unformatparagraph.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [mergeNext(next)](./scribing.unformatparagraph.mergenext.md) |  | Returns an operation that keeps the intention of the current operation and the specified subsequent operation as they were performed as an atomic operation. |
|  [transform(other)](./scribing.unformatparagraph.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |

