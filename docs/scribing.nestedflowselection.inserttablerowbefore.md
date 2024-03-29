<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [NestedFlowSelection](./scribing.nestedflowselection.md) &gt; [insertTableRowBefore](./scribing.nestedflowselection.inserttablerowbefore.md)

## NestedFlowSelection.insertTableRowBefore() method

Creates an operation that inserts a table row before the current selection.

**Signature:**

```typescript
/** @override */
insertTableRowBefore(content: FlowContent, count?: number): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  content | [FlowContent](./scribing.flowcontent.md) | The selected content |
|  count | number | _(Optional)_ Optional. The number of rows to insert. Default is the number of selected rows. |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.

