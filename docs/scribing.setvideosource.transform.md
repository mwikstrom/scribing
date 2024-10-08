<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [SetVideoSource](./scribing.setvideosource.md) &gt; [transform](./scribing.setvideosource.transform.md)

## SetVideoSource.transform() method

Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation.

**Signature:**

```typescript
/** @override */
transform(other: FlowOperation): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  other | [FlowOperation](./scribing.flowoperation.md) | The operation for which to get a transform |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

## Remarks

The specified operation is returned when it is unaffected by the change implied by the current operation.

`null` is returned when the intent of the other operation is cancelled by the change implied by the current operation.

