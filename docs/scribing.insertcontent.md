<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [InsertContent](./scribing.insertcontent.md)

## InsertContent class

Represents an operation that insert flow content.

**Signature:**

```typescript
/** @sealed */
export declare class InsertContent extends InsertContentBase implements InsertContentProps 
```
**Extends:** InsertContentBase

**Implements:** [InsertContentProps](./scribing.insertcontentprops.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.insertcontent.classtype.md) | <p><code>static</code></p><p><code>readonly</code></p> | import("paratype").Type&lt;[InsertContent](./scribing.insertcontent.md)<!-- -->&gt; | The run-time type that represents this class |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertFlow(other)](./scribing.insertcontent.afterinsertflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was inserted. |
|  [afterRemoveFlow(other)](./scribing.insertcontent.afterremoveflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was removed. |
|  [applyToContent(content, theme)](./scribing.insertcontent.applytocontent.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [applyToSelection(selection, mine)](./scribing.insertcontent.applytoselection.md) |  | Applies the current operation on the specified selection and returns the updated result. |
|  [fromData(data)](./scribing.insertcontent.fromdata.md) | <code>static</code> | Gets an instance of the current class from the specified data |
|  [invert()](./scribing.insertcontent.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [mergeNext(next)](./scribing.insertcontent.mergenext.md) |  | Returns an operation that keeps the intention of the current operation and the specified subsequent operation as they were performed as an atomic operation. |
|  [toData()](./scribing.insertcontent.todata.md) |  | Converts the current operation to data |
|  [transform(other)](./scribing.insertcontent.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |

