<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowTableSelection](./scribing.flowtableselection.md) &gt; [formatTableColumn](./scribing.flowtableselection.formattablecolumn.md)

## FlowTableSelection.formatTableColumn() method

Creates an operation that applies the specified table column style on the current selection

**Signature:**

```typescript
/** @override */
formatTableColumn(style: TableColumnStyle): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  style | [TableColumnStyle](./scribing.tablecolumnstyle.md) | The style to unapply |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.

