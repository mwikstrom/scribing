<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md) &gt; [visitRanges](./scribing.flowselection.visitranges.md)

## FlowSelection.visitRanges() method

Visit all ranges in the current selection

**Signature:**

```typescript
abstract visitRanges(callback: (range: FlowRange | CellRange, options: VisitRangeOptions) => void, options?: Partial<VisitRangeOptions>): void;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  callback | (range: [FlowRange](./scribing.flowrange.md) \| [CellRange](./scribing.cellrange.md)<!-- -->, options: [VisitRangeOptions](./scribing.visitrangeoptions.md)<!-- -->) =&gt; void | The callback to invoke for each range |
|  options | Partial&lt;[VisitRangeOptions](./scribing.visitrangeoptions.md)<!-- -->&gt; | _(Optional)_ Options that provide visitor behavior |

**Returns:**

void

