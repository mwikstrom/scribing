<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [NestedFlowOperation](./scribing.nestedflowoperation.md)

## NestedFlowOperation class

A nested operation at a specific flow position

<b>Signature:</b>

```typescript
export declare abstract class NestedFlowOperation extends FlowOperation 
```
<b>Extends:</b> [FlowOperation](./scribing.flowoperation.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [inner](./scribing.nestedflowoperation.inner.md) |  | [FlowOperation](./scribing.flowoperation.md) | The nested operation |
|  [position](./scribing.nestedflowoperation.position.md) |  | number | Position of the nested operation |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertion(range)](./scribing.nestedflowoperation.afterinsertion.md) |  | Transforms the current operation so that its intent is preserved after the specified range was inserted. |
|  [afterRemoval(range)](./scribing.nestedflowoperation.afterremoval.md) |  | Transforms the current operation so that its intent is preserved after the specified range was removed. |
|  [applyToContent(content, theme)](./scribing.nestedflowoperation.applytocontent.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [applyToSelection(selection, mine)](./scribing.nestedflowoperation.applytoselection.md) |  | Applies the current operation on the specified selection and returns the updated result. |
|  [createReplacementNode(content, before)](./scribing.nestedflowoperation.createreplacementnode.md) |  | Creates a replacement node |
|  [getInnerContent(outer)](./scribing.nestedflowoperation.getinnercontent.md) |  | Gets the inner content |
|  [getInnerContentFromNode(node)](./scribing.nestedflowoperation.getinnercontentfromnode.md) |  | Gets the inner content |
|  [getTargetNode(outer)](./scribing.nestedflowoperation.gettargetnode.md) |  | Gets the target node |
|  [invert(content)](./scribing.nestedflowoperation.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [set(key, value)](./scribing.nestedflowoperation.set.md) |  | Returns a copy of the current object with the specified property merged in |
|  [set(key, value)](./scribing.nestedflowoperation.set_1.md) |  | Returns a copy of the current object with the specified property merged in |
|  [transform(other)](./scribing.nestedflowoperation.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |
