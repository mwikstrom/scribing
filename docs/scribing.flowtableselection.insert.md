<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowTableSelection](./scribing.flowtableselection.md) &gt; [insert](./scribing.flowtableselection.insert.md)

## FlowTableSelection.insert() method

Creates an operation that inserts the specified content into the current selection

**Signature:**

```typescript
/** @override */
insert(): FlowOperation | null;
```
**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.

