<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md) &gt; [setIcon](./scribing.flowselection.seticon.md)

## FlowSelection.setIcon() method

Creates an operation that sets the specified icon data in the current selection

**Signature:**

```typescript
abstract setIcon(content: FlowContent, data: string): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  content | [FlowContent](./scribing.flowcontent.md) | The selected content |
|  data | string | The icon data to set |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

`null` is returned when the operation would be a no-op or not applicable on the current selection.

