# webview-bridge

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
- [ ] 提供 dsbridge webview 中的桥接替换