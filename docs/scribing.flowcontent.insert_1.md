<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowContent](./scribing.flowcontent.md) &gt; [insert](./scribing.flowcontent.insert_1.md)

## FlowContent.insert() method

Inserts the specified nodes at the specified position

<b>Signature:</b>

```typescript
insert(position: number, theme: FlowTheme | undefined, ...nodes: readonly FlowNode[]): FlowContent;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  position | number | The position at which nodes shall be inserted |
|  theme | [FlowTheme](./scribing.flowtheme.md) \| undefined | Theme of the current content |
|  nodes | readonly [FlowNode](./scribing.flownode.md)<!-- -->\[\] | The nodes to be inserted |

<b>Returns:</b>

[FlowContent](./scribing.flowcontent.md)

The updated flow content
