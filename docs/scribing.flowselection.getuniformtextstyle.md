<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md) &gt; [getUniformTextStyle](./scribing.flowselection.getuniformtextstyle.md)

## FlowSelection.getUniformTextStyle() method

Gets the uniform text style of the current selection

<b>Signature:</b>

```typescript
abstract getUniformTextStyle(content: FlowContent, theme?: FlowTheme, diff?: Set<keyof TextStyleProps>): TextStyle;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  content | [FlowContent](./scribing.flowcontent.md) | The selected content |
|  theme | [FlowTheme](./scribing.flowtheme.md) | Theme of the selected content |
|  diff | Set&lt;keyof [TextStyleProps](./scribing.textstyleprops.md)<!-- -->&gt; | An optional set that is populated with style keys with non-uniform values |

<b>Returns:</b>

[TextStyle](./scribing.textstyle.md)
