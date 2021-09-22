<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md) &gt; [decrementListLevel](./scribing.flowselection.decrementlistlevel.md)

## FlowSelection.decrementListLevel() method

Creates an operation that decrements the list level of the current selection

<b>Signature:</b>

```typescript
decrementListLevel(options?: TargetOptions, delta?: number): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  options | [TargetOptions](./scribing.targetoptions.md) | Options that provide operation behavior |
|  delta | number | Optional list level decrement. Default is <code>1</code>. |

<b>Returns:</b>

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.
