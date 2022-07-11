# @netless/webview-bridge

不同平台的 webview 都会提供各种方式，使得 web 端的代码，可以与平台代码交互。iOS，Android，flutter，React-Native 都存在这种通信方式。两端通信，不仅仅需要 web 端做一些配置，还需要平台端做一些配置。这里只包含 web 端的配置。
由于 React-Native 的特性，所以这个库中的一些代码，逻辑，类型，可以提供给 React-Native 使用，达到一定程度的复用，同时提高维护性。

该库目前桥接的目标为 React-Native。  
iOS，Android 的 web 桥接，可以通过 [dsbridge](https://www.npmjs.com/package/dsbridge) 实现，该库在对应的 iOS 和 Android 端有对应的实现

## install

```shell
# uuid 版本过多，所以只标识为 peer dependency
npm install @netless/webview-bridge uuid
```

## TODO

- [ ] 提供 flutter webview 中的桥接
- [x] 提供 dsbridge webview 中的桥接替换

## 接口设计

1. js 端调用 native 时，同步和异步的 api 应该分开，而不是像 dsbridge 那样，都是用同一个 call API，非常容易混淆。应该分为 callSync 和 callAsync 两种，而且由于同步的阻塞性，默认应该是 callAsync。
2. js 注册 API 时，不应该是 register 和 registerAsync，实际上这两个 api 对于 native 而言，都是异步的，这个命名会让人非常困惑。两者的不同点在于后者的回调可以重复调用，也就是可以不断回调，通常作为进度回调使用。所以应该注册为 register 和 registerProgress 