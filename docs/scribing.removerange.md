<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [RemoveRange](./scribing.removerange.md)

## RemoveRange class

Represents an operation that removes a range of flow.

<b>Signature:</b>

```typescript
/** @sealed */
export declare class RemoveRange extends RemoveRangeBase implements Readonly<RemoveRangeProps> 
```
<b>Extends:</b> RemoveRangeBase

<b>Implements:</b> Readonly&lt;[RemoveRangeProps](./scribing.removerangeprops.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.removerange.classtype.md) | <code>static</code> | import("paratype").Type&lt;[RemoveRange](./scribing.removerange.md)<!-- -->&gt; | The run-time type that represents this class |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertFlow(other)](./scribing.removerange.afterinsertflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was inserted. |
|  [afterRemoveFlow(other)](./scribing.removerange.afterremoveflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was removed. |
|  [applyToContent(content)](./scribing.removerange.applytocontent.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [applyToSelection(selection, mine)](./scribing.removerange.applytoselection.md) |  | Applies the current operation on the specified selection and returns the updated result. |
|  [fromData(data)](./scribing.removerange.fromdata.md) | <code>static</code> | Gets an instance of the current class from the specified data |
|  [invert(content)](./scribing.removerange.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [mergeNext(next)](./scribing.removerange.mergenext.md) |  | Returns an operation that keeps the intention of the current operation and the specified subsequent operation as they were performed as an atomic operation. |
|  [transform(other)](./scribing.removerange.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |

