<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md) &gt; [formatTableColumn](./scribing.flowselection.formattablecolumn.md)

## FlowSelection.formatTableColumn() method

Creates an operation that applies the specified table column style on the current selection

**Signature:**

```typescript
abstract formatTableColumn(style: TableColumnStyle, options?: TargetOptions): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  style | [TableColumnStyle](./scribing.tablecolumnstyle.md) | The style to unapply |
|  options | [TargetOptions](./scribing.targetoptions.md) | _(Optional)_ |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.

