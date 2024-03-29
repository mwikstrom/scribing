<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowTableSelection](./scribing.flowtableselection.md) &gt; [insertTableColumnBefore](./scribing.flowtableselection.inserttablecolumnbefore.md)

## FlowTableSelection.insertTableColumnBefore() method

Creates an operation that inserts a table column before the current selection.

**Signature:**

```typescript
/** @override */
insertTableColumnBefore(_: FlowContent, count?: number): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  \_ | [FlowContent](./scribing.flowcontent.md) |  |
|  count | number | _(Optional)_ Optional. The number of columns to insert. Default is the number of selected columns. |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.

