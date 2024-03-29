<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowRangeSelection](./scribing.flowrangeselection.md) &gt; [formatBox](./scribing.flowrangeselection.formatbox.md)

## FlowRangeSelection.formatBox() method

Creates an operation that applies the specified box style on the current selection

**Signature:**

```typescript
/** @override */
formatBox(style: BoxStyle): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  style | [BoxStyle](./scribing.boxstyle.md) | The style to apply |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.

