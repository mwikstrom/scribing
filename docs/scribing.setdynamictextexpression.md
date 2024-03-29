<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [SetDynamicTextExpression](./scribing.setdynamictextexpression.md)

## SetDynamicTextExpression class

Represents an operation that sets the expression of dynamic text

**Signature:**

```typescript
/** @sealed */
export declare class SetDynamicTextExpression extends SetDynamicTextExpressionBase implements SetDynamicTextExpressionProps 
```
**Extends:** SetDynamicTextExpressionBase

**Implements:** [SetDynamicTextExpressionProps](./scribing.setdynamictextexpressionprops.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.setdynamictextexpression.classtype.md) | <p><code>static</code></p><p><code>readonly</code></p> | import("paratype").Type&lt;[SetDynamicTextExpression](./scribing.setdynamictextexpression.md)<!-- -->&gt; | The run-time type that represents this class |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertFlow(range)](./scribing.setdynamictextexpression.afterinsertflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was inserted. |
|  [afterRemoveFlow(range)](./scribing.setdynamictextexpression.afterremoveflow.md) |  | Transforms the current operation so that its intent is preserved after the specified range was removed. |
|  [applyToContent(content)](./scribing.setdynamictextexpression.applytocontent.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [applyToSelection(selection)](./scribing.setdynamictextexpression.applytoselection.md) |  | Applies the current operation on the specified selection and returns the updated result. |
|  [fromData(data)](./scribing.setdynamictextexpression.fromdata.md) | <code>static</code> | Gets an instance of the current class from the specified data |
|  [invert(content)](./scribing.setdynamictextexpression.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [mergeNext(next)](./scribing.setdynamictextexpression.mergenext.md) |  | Returns an operation that keeps the intention of the current operation and the specified subsequent operation as they were performed as an atomic operation. |
|  [transform(other)](./scribing.setdynamictextexpression.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |

