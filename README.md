# bridge-project


this repo contains `@netless/webview-bridge`,`@netless/react-native-bridge`,`@netless/whiteboard-bridge-types`

## development

```shell
pnpm i
# @netless/react-native-bridge depends on @netless/webview-bridge's build
pnpm -r build
```

```shell
# changeset 默认命令就是 add，可以不写 add
pnpm changeset add

# 提交改动
# changeset add 自动 commit 只提交他自己的 changeset 文件，其他文件需要自己改动
git add <files>
git commit -m <message>
```

## build

```shell
pnpm -r build
```

## publish

```shell
# 生成 changelog
pnpm changeset version
# changelog 不会被提交，手动补充下
git commit -a --amend --no-edit
# 平时使用 changeset 生成变更，publish 时，changeset 可以自动生成 changelog
# pnpm run publish 才会执行 scripts 中的 publish 脚本
pnpm run publish
# 默认生成的 tags 不会 push 到 git，需要单独 push
git push --follow-tags
```