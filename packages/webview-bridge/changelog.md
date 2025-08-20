# webview-bridge

## 0.1.12

### Patch Changes

- b639216: Return syncCall ret for iOS prompt

## 0.1.11

### Patch Changes

- 95a0ad0: Ensure `window.webkit` is undefined before use

## 0.1.10

### Patch Changes

- 170e223: Ensure `window.webkit.messageHandlers.asyncBridge` value before use it

## 0.1.8

### Patch Changes

- 01e080a: fix asyn callback error

## 0.1.7

### Patch Changes

- 36d6e79: fix setTimeout call crash

## 0.1.6

### Patch Changes

- f67f8f0: add ready post for backforward compatible

## 0.1.5

### Patch Changes

- cc48890: export register map

## 0.1.4

### Patch Changes

- 7a30193: json value support void

## 0.1.3

### Patch Changes

- 0561103: refactor types

## 0.1.2

### Patch Changes

- 70a3859: export bridge types

## 0.1.1

### Patch Changes

- cf8e013: change rn export name

## 0.1.0

### Minor Changes

- b2bb26c: replace dsbridge and support more call method

## 0.0.14

### Patch Changes

- 0b58a14: update dist for 0.0.12

## 0.0.13

### Patch Changes

- e4e6418: will not export const `bridge`, will break some import code

## 0.0.12

### Patch Changes

- 984d600: fix call function's params maybe optional

## 0.0.11

### Patch Changes

- a999d7e: fix undefined callback

# 0.0.10

修复 callback 回调，永远为 success 的问题

# 0.0.9

补发 build 文件包，增加特殊情况处理，以及日志输出功能

# 0.0.8

修复 Android 平台上，无法正确接受到 message 事件

# 0.0.7

修复由于 rebase 导致 0.0.6 引入的 callAsync 事件回调问题

# 0.0.6

修复 call API，参数顺序错位问题

# 0.0.5

修复没有正确监听 window message 事件

# 0.0.4

修复带 callback 回调的接口，没有正确调用

# 0.0.3

基础功能版本
