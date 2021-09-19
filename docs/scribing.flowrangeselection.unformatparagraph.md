<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowRangeSelection](./scribing.flowrangeselection.md) &gt; [unformatParagraph](./scribing.flowrangeselection.unformatparagraph.md)

## FlowRangeSelection.unformatParagraph() method

Creates an operation that unapplies the specified paragraph style on the current selection

<b>Signature:</b>

```typescript
/** @override */
unformatParagraph(style: ParagraphStyle): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  style | [ParagraphStyle](./scribing.paragraphstyle.md) | The style to unapply |

<b>Returns:</b>

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.
