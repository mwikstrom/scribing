<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md) &gt; [removeTableColumn](./scribing.flowselection.removetablecolumn.md)

## FlowSelection.removeTableColumn() method

Creates an operation that removes the selected table column

<b>Signature:</b>

```typescript
abstract removeTableColumn(content: FlowContent): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  content | [FlowContent](./scribing.flowcontent.md) | The selected content |

<b>Returns:</b>

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.
