<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [SplitTableCell](./scribing.splittablecell.md)

## SplitTableCell class

Represents an operation that splits a merged table cell

**Signature:**

```typescript
/** @sealed */
export declare class SplitTableCell extends SplitTableCellBase implements SplitTableCellProps 
```
**Extends:** SplitTableCellBase

**Implements:** [SplitTableCellProps](./scribing.splittablecellprops.md)

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.splittablecell.classtype.md) | <p><code>static</code></p><p><code>readonly</code></p> | import("paratype").Type&lt;[SplitTableCell](./scribing.splittablecell.md)<!-- -->&gt; | The run-time type that represents this class |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertAxis(axis, index, count)](./scribing.splittablecell.afterinsertaxis.md) |  |  |
|  [afterInsertColumn(index, count)](./scribing.splittablecell.afterinsertcolumn.md) |  |  |
|  [afterInsertRow(index, count)](./scribing.splittablecell.afterinsertrow.md) |  |  |
|  [afterRemoveAxis(axis, index, count)](./scribing.splittablecell.afterremoveaxis.md) |  |  |
|  [afterRemoveColumn(index, count)](./scribing.splittablecell.afterremovecolumn.md) |  |  |
|  [afterRemoveRow(index, count)](./scribing.splittablecell.afterremoverow.md) |  |  |
|  [applyToCellRange(range)](./scribing.splittablecell.applytocellrange.md) | <code>protected</code> |  |
|  [applyToTable(table)](./scribing.splittablecell.applytotable.md) | <code>protected</code> |  |
|  [fromData(input)](./scribing.splittablecell.fromdata.md) | <code>static</code> | Gets an instance of the current class from the specified data |
|  [invertForTable(table)](./scribing.splittablecell.invertfortable.md) | <code>protected</code> |  |
|  [mergeNextInSameTable()](./scribing.splittablecell.mergenextinsametable.md) | <code>protected</code> |  |
|  [transformInSameTable(other)](./scribing.splittablecell.transforminsametable.md) | <code>protected</code> |  |

