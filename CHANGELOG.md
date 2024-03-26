## 1.7.3 - 2024-03-26

- Fix: Keep list marker style when transcluding into start of list item paragraph

## 1.7.2 - 2024-03-26

- Merge list when transcluding into the start of a list item paragraph

## 1.7.1 - 2023-09-25

- Fix: Support white-space-only text to flow conversion

## 1.7.0 - 2023-09-25

- New feature: `FlowCursor.moveToStart()` + `FlowCursor.moveToEnd()`
- Behavior change: `FlowCursor.move()` no longer throws (by default) when resulting position is invalid

## 1.6.1 - 2023-09-21

- Fix: Alternating list markers in text conversion from ordered and unordered lists

## 1.6.0 - 2023-09-21

- New feature: `serializeFlowContentToText`
- New feature: `deserializeFlowContentFromText`

## 1.5.3 - 2023-09-21

- Fix: Process nested markup when serializing html

## 1.5.2 - 2023-09-21

- Fix: Default list marker kind (unordered)

## 1.5.1 - 2023-09-21

- Fix: async writing (html serialization)

## 1.5.0 - 2023-04-25

- New feture: Additional visitor methods

## 1.4.0 - 2023-04-21

- New feature: `isEmptyFlowContent`

## 1.3.0 - 2023-04-18

- New feature: `serializeFlowContentToHtml`
- New feature: `processMarkup` and `processNestedMarkup`
- New feature: `extractMarkup`
- New feature: `getTableColumnWidths`

## 1.2.2 - 2023-03-16

- Fix: Use table cell theme (in edit table cell operation too)

## 1.2.2 - 2023-03-16

- Fix: Use table cell theme

## 1.2.1 - 2023-03-16

- Bump (1.2.0 didn't show up at npmjs.com)

## 1.2.0 - 2023-03-16

- New feature: `FlowTheme.getTableBodyTheme()` and `FlowTheme.getTableHeadingTheme()`

## 1.1.0 - 2022-08-25

- New feature: `AsyncFlowNodeVisitor`

## 1.0.0 - 2022-05-04

The first non-preview/development release.
