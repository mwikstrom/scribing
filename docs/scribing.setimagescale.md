<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [SetImageScale](./scribing.setimagescale.md)

## SetImageScale class

Represents an operation that sets the source of an image

<b>Signature:</b>

```typescript
/** @sealed */
export declare class SetImageScale extends SetImageScaleBase implements SetImageScaleProps 
```
<b>Extends:</b> SetImageScaleBase

<b>Implements:</b> [SetImageScaleProps](./scribing.setimagescaleprops.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.setimagescale.classtype.md) | <code>static</code> | import("paratype").Type&lt;[SetImageScale](./scribing.setimagescale.md)<!-- -->&gt; | The run-time type that represents this class |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertFlow(range)](./scribing.setimagescale.afterinsertflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was inserted. |
|  [afterRemoveFlow(range)](./scribing.setimagescale.afterremoveflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was removed. |
|  [applyToContent(content)](./scribing.setimagescale.applytocontent.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [applyToSelection(selection)](./scribing.setimagescale.applytoselection.md) |  | Applies the current operation on the specified selection and returns the updated result. |
|  [fromData(data)](./scribing.setimagescale.fromdata.md) | <code>static</code> | Gets an instance of the current class from the specified data |
|  [invert(content)](./scribing.setimagescale.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [mergeNext(next)](./scribing.setimagescale.mergenext.md) |  | Returns an operation that keeps the intention of the current operation and the specified subsequent operation as they were performed as an atomic operation. |
|  [transform(other)](./scribing.setimagescale.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |
