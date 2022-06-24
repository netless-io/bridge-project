# bridge-project


this repo contains `@netless/webview-bridge`,`@netless/react-native-bridge`,`@netless/whiteboard-bridge-types`

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
# 平时使用 changeset 生成变更，publish 时，changeset 可以自动生成 changelog
# pnpm run publish 才会执行 scripts 中的 publish 脚本
pnpm run publish
# 默认生成的 tags 不会 push 到 git，需要手动 push
git push --tags
```