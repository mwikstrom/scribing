<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowTableSelection](./scribing.flowtableselection.md) &gt; [incrementListLevel](./scribing.flowtableselection.incrementlistlevel.md)

## FlowTableSelection.incrementListLevel() method

Creates an operation that increments the list level of the current selection

<b>Signature:</b>

```typescript
/** @override */
incrementListLevel(content: FlowContent, delta?: number): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  content | [FlowContent](./scribing.flowcontent.md) | The selected content |
|  delta | number | Optional list level increment. Default is <code>1</code>. |

<b>Returns:</b>

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.
