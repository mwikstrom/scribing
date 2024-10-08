<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [FlowSelection](./scribing.flowselection.md)

## FlowSelection class

Represents a selection of flow content

**Signature:**

```typescript
export declare abstract class FlowSelection 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [baseType](./scribing.flowselection.basetype.md) | <p><code>static</code></p><p><code>readonly</code></p> | import("paratype").Type&lt;[FlowSelection](./scribing.flowselection.md)<!-- -->&gt; | The run-time type that represents the base class |
|  [isCollapsed](./scribing.flowselection.iscollapsed.md) | <p><code>abstract</code></p><p><code>readonly</code></p> | boolean | Determines whether the current selection is collapsed |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [decrementListLevel(content, delta)](./scribing.flowselection.decrementlistlevel.md) |  | Creates an operation that decrements the list level of the current selection |
|  [formatBox(style, options)](./scribing.flowselection.formatbox.md) | <code>abstract</code> | Creates an operation that applies the specified box style on the current selection |
|  [formatList(content, kind)](./scribing.flowselection.formatlist.md) | <code>abstract</code> | Creates an operation that applies the specified list format to the current selection. |
|  [formatParagraph(style, options)](./scribing.flowselection.formatparagraph.md) | <code>abstract</code> | Creates an operation that applies the specified paragraph style on the current selection |
|  [formatTable(style, options)](./scribing.flowselection.formattable.md) | <code>abstract</code> | Creates an operation that applies the specified table style on the current selection |
|  [formatTableColumn(style, options)](./scribing.flowselection.formattablecolumn.md) | <code>abstract</code> | Creates an operation that applies the specified table column style on the current selection |
|  [formatText(style, options)](./scribing.flowselection.formattext.md) | <code>abstract</code> | Creates an operation that applies the specified text style on the current selection |
|  [fromJsonValue(value)](./scribing.flowselection.fromjsonvalue.md) | <code>static</code> | Converts the specified JSON value to a flow selection |
|  [getUniformBoxStyle(content, theme, diff)](./scribing.flowselection.getuniformboxstyle.md) | <code>abstract</code> | Gets the uniform box style of the current selection |
|  [getUniformParagraphStyle(content, theme, diff)](./scribing.flowselection.getuniformparagraphstyle.md) | <code>abstract</code> | Gets the uniform paragraph style of the current selection |
|  [getUniformTextStyle(content, theme, diff)](./scribing.flowselection.getuniformtextstyle.md) | <code>abstract</code> | Gets the uniform text style of the current selection |
|  [incrementListLevel(content, delta)](./scribing.flowselection.incrementlistlevel.md) | <code>abstract</code> | Creates an operation that increments the list level of the current selection |
|  [insert(content, options)](./scribing.flowselection.insert.md) | <code>abstract</code> | Creates an operation that inserts the specified content into the current selection |
|  [insertTableColumnAfter(content, count)](./scribing.flowselection.inserttablecolumnafter.md) | <code>abstract</code> | Creates an operation that inserts a table column after the current selection. |
|  [insertTableColumnBefore(content, count)](./scribing.flowselection.inserttablecolumnbefore.md) | <code>abstract</code> | Creates an operation that inserts a table column before the current selection. |
|  [insertTableRowAfter(content, count)](./scribing.flowselection.inserttablerowafter.md) | <code>abstract</code> | Creates an operation that inserts a table row after the current selection. |
|  [insertTableRowBefore(content, count)](./scribing.flowselection.inserttablerowbefore.md) | <code>abstract</code> | Creates an operation that inserts a table row before the current selection. |
|  [mergeTableCell(content)](./scribing.flowselection.mergetablecell.md) | <code>abstract</code> | Creates an operation that merges the selected table cells. |
|  [remove(options)](./scribing.flowselection.remove.md) | <code>abstract</code> | Creates an operation that removes the content of the current selection |
|  [removeTableColumn(content)](./scribing.flowselection.removetablecolumn.md) | <code>abstract</code> | Creates an operation that removes the selected table column |
|  [removeTableRow(content)](./scribing.flowselection.removetablerow.md) | <code>abstract</code> | Creates an operation that removes the selected table row |
|  [setDynamicTextExpression(content, expression)](./scribing.flowselection.setdynamictextexpression.md) | <code>abstract</code> | Creates an operation that sets the specified dynamic text expression in the current selection |
|  [setIcon(content, data)](./scribing.flowselection.seticon.md) | <code>abstract</code> | Creates an operation that sets the specified icon data in the current selection |
|  [setImageScale(content, scale)](./scribing.flowselection.setimagescale.md) | <code>abstract</code> | Creates an operation that sets the specified image scale factor in the current selection |
|  [setImageSource(content, source)](./scribing.flowselection.setimagesource.md) | <code>abstract</code> | Creates an operation that sets the specified image source in the current selection |
|  [setMarkupAttr(content, key, value)](./scribing.flowselection.setmarkupattr.md) | <code>abstract</code> | Creates an operation that sets the specified markup attribute in the current selection |
|  [setMarkupTag(content, tag)](./scribing.flowselection.setmarkuptag.md) | <code>abstract</code> | Creates an operation that sets the specified markup tag in the current selection |
|  [setVideoSource(content, source)](./scribing.flowselection.setvideosource.md) | <code>abstract</code> | Creates an operation that sets the specified video source in the current selection |
|  [splitTableCell(content)](./scribing.flowselection.splittablecell.md) | <code>abstract</code> | Creates an operation that splits the selected table cells (given that it is a merged cell) |
|  [toJsonValue()](./scribing.flowselection.tojsonvalue.md) |  | Converts the current selection to a JSON value |
|  [transformRanges(transform, options)](./scribing.flowselection.transformranges.md) | <code>abstract</code> | Transforms all ranges in the current selection |
|  [unformatBox(style, options)](./scribing.flowselection.unformatbox.md) | <code>abstract</code> | Creates an operation that unapplies the specified box style on the current selection |
|  [unformatParagraph(style, options)](./scribing.flowselection.unformatparagraph.md) | <code>abstract</code> | Creates an operation that unapplies the specified paragraph style on the current selection |
|  [unformatTable(style, options)](./scribing.flowselection.unformattable.md) | <code>abstract</code> | Creates an operation that unapplies the specified table style on the current selection |
|  [unformatTableColumn(style, options)](./scribing.flowselection.unformattablecolumn.md) | <code>abstract</code> | Creates an operation that unapplies the specified table column style on the current selection |
|  [unformatText(style, options)](./scribing.flowselection.unformattext.md) | <code>abstract</code> | Creates an operation that unapplies the specified text style on the current selection |
|  [unsetMarkupAttr(content, key)](./scribing.flowselection.unsetmarkupattr.md) | <code>abstract</code> | Creates an operation that unsets the specified markup attribute in the current selection |
|  [visitRanges(callback, options)](./scribing.flowselection.visitranges.md) | <code>abstract</code> | Visit all ranges in the current selection |

