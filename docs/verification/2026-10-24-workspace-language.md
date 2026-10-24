# 模型工作台跟随 DSH 语言验证

## 实现

插件将 `t.locale` 映射为引擎支持的固定语言 ID，通过原生 `locale` 查询参数传给内嵌工作台。宿主语言服务不可用时回退到 DSH 文档 `lang`，不支持的语言回退英语。语言变化更新 iframe 地址，重新打开仍重新读取宿主语言。

不改引擎二进制，不写引擎保存的语言、账号或其他配置。内嵌模式由 DSH 控制语言；引擎独立页面仍使用自身偏好。DSH 切换语言会重新加载内嵌页面。

## 已执行

- `node scripts/workspace-language-test.mjs`：通过。使用真实 `ModelWorkspace`，覆盖简繁中文、英语、日语、德语、无效标签、宿主优先级、文档回退、切换和重新挂载。
- `node scripts/test-all.mjs --mode contributor --only workspace-language`：1/1 通过，已接入统一回归入口。
- `node scripts/test-all.mjs --mode contributor --only client-lint`：1/1 通过。
- `node scripts/plugin-bench-ui-test.mjs`：9 项通过。
- `npm run typecheck`、`npm run typecheck:standalone`：通过。
- 独立前端重新构建后，`node scripts/build-standalone-ui.mjs --check`、`node scripts/build-standalone-channels.mjs --check`：通过。
- `node --check client.js`、`git diff --check`：通过。
- 本机隔离预览使用真实插件 Shell、管理路由及已编译 macOS arm64 引擎：英语宿主显示 `Providers`；中文宿主显示「供应商」，未在引擎设置内手动切换语言。
- 已备份并同步本机安装目录的 `client.js`，在实际 DSH 触发热重载并返回中文工作台。没有进行真实上游推理或账号导入。

## 边界

未执行全量贡献者套件和发布签名检查，本轮不是版本发布。原生 DSH 英文切换的下拉控件自动化不稳定，没有将隔离预览的中英文对照写成原生 DSH 完整切换验收。隔离预览和原生窗口操作均未修改用户账号、模型或密钥。
