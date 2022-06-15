# bridge-project


this repo contains `@netless/webview-bridge`,`@netless/react-native-bridge`.

## development

```shell
pnpm i
# @netless/react-native-bridge depends on @netless/webview-bridge's build
pnpm -r build
```

## build

```shell
pnpm -r build
```

## publish

```shell
pnpm i
pnpm -r build
# publish @netless/webview-bridge to npm
pnpm -F webview-bridge publish --access=public
# publish @netless/react-native-bridge to npm
pnpm -F react-native-bridge publish --access=public
# publish @netless/whiteboard-bridge-types to npm
pnpm -F @netless/whiteboard-bridge-types publish --access=public
```