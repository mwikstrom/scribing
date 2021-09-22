<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowEditorStateData](./scribing.floweditorstatedata.md)

## FlowEditorStateData interface

Data for [FlowEditorState](./scribing.floweditorstate.md)

<b>Signature:</b>

```typescript
export interface FlowEditorStateData extends Partial<Omit<FlowEditorStateProps, "selection" | "undoStack" | "redoStack">> 
```
<b>Extends:</b> Partial&lt;Omit&lt;[FlowEditorStateProps](./scribing.floweditorstateprops.md)<!-- -->, "selection" \| "undoStack" \| "redoStack"&gt;&gt;

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [redo?](./scribing.floweditorstatedata.redo.md) | readonly [FlowOperation](./scribing.flowoperation.md)<!-- -->\[\] | <i>(Optional)</i> |
|  [selection?](./scribing.floweditorstatedata.selection.md) | [FlowSelection](./scribing.flowselection.md) | <i>(Optional)</i> |
|  [undo?](./scribing.floweditorstatedata.undo.md) | readonly [FlowOperation](./scribing.flowoperation.md)<!-- -->\[\] | <i>(Optional)</i> |
