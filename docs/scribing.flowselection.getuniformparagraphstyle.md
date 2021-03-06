<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md) &gt; [getUniformParagraphStyle](./scribing.flowselection.getuniformparagraphstyle.md)

## FlowSelection.getUniformParagraphStyle() method

Gets the uniform paragraph style of the current selection

<b>Signature:</b>

```typescript
abstract getUniformParagraphStyle(content: FlowContent, theme?: FlowTheme, diff?: Set<keyof ParagraphStyleProps>): ParagraphStyle;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  content | [FlowContent](./scribing.flowcontent.md) | The selected content |
|  theme | [FlowTheme](./scribing.flowtheme.md) | <i>(Optional)</i> Theme of the selected content |
|  diff | Set&lt;keyof [ParagraphStyleProps](./scribing.paragraphstyleprops.md)<!-- -->&gt; | <i>(Optional)</i> An optional set that is populated with style keys with non-uniform values |

<b>Returns:</b>

[ParagraphStyle](./scribing.paragraphstyle.md)

