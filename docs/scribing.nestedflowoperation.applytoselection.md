<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [NestedFlowOperation](./scribing.nestedflowoperation.md) &gt; [applyToSelection](./scribing.nestedflowoperation.applytoselection.md)

## NestedFlowOperation.applyToSelection() method

Applies the current operation on the specified selection and returns the updated result.

**Signature:**

```typescript
/** @override */
applyToSelection(selection: FlowSelection, mine: boolean): FlowSelection | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  selection | [FlowSelection](./scribing.flowselection.md) | The selection that shall be updated. |
|  mine | boolean | Specifies whether the current operation is executed by the same user that owns the selection. |

**Returns:**

[FlowSelection](./scribing.flowselection.md) \| null

