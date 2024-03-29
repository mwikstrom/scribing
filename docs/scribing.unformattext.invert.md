<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [UnformatText](./scribing.unformattext.md) &gt; [invert](./scribing.unformattext.invert.md)

## UnformatText.invert() method

Returns an operation that negates the effect of the current operation.

**Signature:**

```typescript
/** @override */
invert(content: FlowContent): FlowOperation | null;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  content | [FlowContent](./scribing.flowcontent.md) | The state, before the current operation is applied, that shall be used to compute an inverse. |

**Returns:**

[FlowOperation](./scribing.flowoperation.md) \| null

An inverse of the current operation, or `null` when the current operation cannot be inverted with respect to the supplied state.

