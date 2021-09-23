<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [NestedFlowSelection](./scribing.nestedflowselection.md)

## NestedFlowSelection class

A nested selection at a specific flow position

<b>Signature:</b>

```typescript
export declare abstract class NestedFlowSelection extends FlowSelection 
```
<b>Extends:</b> [FlowSelection](./scribing.flowselection.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [isCollapsed](./scribing.nestedflowselection.iscollapsed.md) |  | boolean | Determines whether the current selection is collapsed |
|  [position](./scribing.nestedflowselection.position.md) |  | number | Position of the nested selection |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertion(range)](./scribing.nestedflowselection.afterinsertion.md) |  | Transforms the current selection so that its intended boundary is preserved after the specified range was inserted. |
|  [afterRemoval(range, mine)](./scribing.nestedflowselection.afterremoval.md) |  | Transforms the current selection so that its intended boundary is preserved after the specified range was inserted. |
|  [formatParagraph(style, options)](./scribing.nestedflowselection.formatparagraph.md) |  | Creates an operation that applies the specified paragraph style on the current selection |
|  [formatText(style, options)](./scribing.nestedflowselection.formattext.md) |  | Creates an operation that applies the specified text style on the current selection |
|  [getInnerContent(outer)](./scribing.nestedflowselection.getinnercontent.md) |  | Gets the inner content |
|  [getInnerContentFromNode(node)](./scribing.nestedflowselection.getinnercontentfromnode.md) |  | Gets the inner content |
|  [getInnerSelection()](./scribing.nestedflowselection.getinnerselection.md) |  | Gets the inner selection |
|  [getOuterOperation(inner)](./scribing.nestedflowselection.getouteroperation.md) |  | Wraps the specified operation so that it applies the outer selection |
|  [getSelectedNode(outer)](./scribing.nestedflowselection.getselectednode.md) |  | Gets the selected (outer) node |
|  [getUniformParagraphStyle(content, theme, diff)](./scribing.nestedflowselection.getuniformparagraphstyle.md) |  | Gets the uniform paragraph style of the current selection |
|  [getUniformTextStyle(content, theme, diff)](./scribing.nestedflowselection.getuniformtextstyle.md) |  | Gets the uniform text style of the current selection |
|  [incrementListLevel(content, delta)](./scribing.nestedflowselection.incrementlistlevel.md) |  | Creates an operation that increments the list level of the current selection |
|  [insert(content, options)](./scribing.nestedflowselection.insert.md) |  | Creates an operation that inserts the specified content into the current selection |
|  [remove(options)](./scribing.nestedflowselection.remove.md) |  | Creates an operation that removes the content of the current selection |
|  [set(key, value)](./scribing.nestedflowselection.set.md) |  | Returns a copy of the current object with the specified property merged in |
|  [setInnerSelection(value)](./scribing.nestedflowselection.setinnerselection.md) |  | Returns a copy of this selection with the specified inner selection merged in |
|  [transformRanges(transform, options)](./scribing.nestedflowselection.transformranges.md) |  | Transforms all ranges in the current selection |
|  [unformatParagraph(style)](./scribing.nestedflowselection.unformatparagraph.md) |  | Creates an operation that unapplies the specified paragraph style on the current selection |
|  [unformatText(style)](./scribing.nestedflowselection.unformattext.md) |  | Creates an operation that unapplies the specified paragraph style on the current selection |
