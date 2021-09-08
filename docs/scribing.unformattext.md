<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [scribing](./scribing.md) &gt; [UnformatText](./scribing.unformattext.md)

## UnformatText class

Represents an operation that unapplies a text style to a range of flow content.

<b>Signature:</b>

```typescript
/** @sealed */
export declare class UnformatText extends BASE implements Readonly<UnformatTextProps> 
```
<b>Extends:</b> BASE

<b>Implements:</b> Readonly&lt;[UnformatTextProps](./scribing.unformattextprops.md)<!-- -->&gt;

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [classType](./scribing.unformattext.classtype.md) | <code>static</code> | import("paratype").Type&lt;[UnformatText](./scribing.unformattext.md)<!-- -->&gt; |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [afterInsertion(other)](./scribing.unformattext.afterinsertion.md) |  |  |
|  [afterRemoval(other)](./scribing.unformattext.afterremoval.md) |  |  |
|  [applyTo(container)](./scribing.unformattext.applyto.md) |  | Applies the current operation on the specified content and returns the updated result. |
|  [fromData(data)](./scribing.unformattext.fromdata.md) | <code>static</code> |  |
|  [invert(state)](./scribing.unformattext.invert.md) |  | Returns an operation that negates the effect of the current operation. |
|  [transform(other)](./scribing.unformattext.transform.md) |  | Transforms the specified operation to with respect to change implied by the current operation so that the intent of the operation is retained when it is applied after the current operation. |
