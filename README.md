# 配一句 · AI 发圈助手

不知道怎么发？丢张照片，或者说句话，AI 帮你配一句。

## 是什么

输入一个场景或想法，按平台（朋友圈 / 抖音 / 小红书）生成 6 种风格各一条的文案：
**忧郁 / 抽象 / 文艺 / 歌词 / 治愈 / 简短**。

## 技术

- 纯静态 H5（原生 HTML / CSS / JS，无框架无构建），PWA，可"添加到主屏幕"
- 文案引擎：浏览器直连大模型（OpenAI 兼容 `/chat/completions`，默认 DeepSeek，可选智谱 / OpenAI / 自定义）
- 无 Key 时自动降级到内置金句种子库（19 个场景 × 6 风格）
- 文案库、收藏、设置全部存本机 localStorage，不上传服务器

## 目录

| 路径 | 说明 |
|------|------|
| `peiyiju/` | 源码（部署时把这个目录整个上传即可） |
| `peiyiju/文案种子库-v2.md` | 四种文案 DNA 的套路拆解 + 通用句 60 条 + 场景库 |
| `peiyiju/歌词文案合集-v1.md` | 大热歌词文案（按歌手整理，仅供个人参考）+ 歌词感套路 + 原创句 |
| `peiyiju/_make_icons.py` | 用纯标准库生成 PWA 图标（无 PIL 依赖） |
| `配一句-启动看板.html` | 设计封板后的两周行动看板 |

> `peiyiju-dist/` 是部署产物，已在 .gitignore 中忽略。

## 部署

```bash
# EdgeOne Pages（当前在用）
edgeone pages deploy ./peiyiju-dist -n peiyiju -e production

# 或任何静态托管：把 peiyiju/ 整个目录扔上去即可
```

## 上线前的两件事

1. **密钥要挪到服务端**：现在浏览器直连大模型，Key 存在用户本地。正式对外改成云函数代理——
   把 `app.js` 顶部的 `USE_PROXY` 改成 `true` 并填 `PROXY_URL`，`/api/generate` 与 `/api/library`
   的逻辑迁到服务端即可，前端 `apiGenerate` / `apiLibraryAdd` / `apiLibraryPatch` 三个函数不用动。
2. **域名要备案**：EdgeOne 预设域名（`*.edgeone.cool`）默认带访问鉴权，只有 3 小时有效的签名链接，
   且未备案域名在微信内可能被拦截。要长期稳定直访，需绑定已完成 ICP 备案的自定义域名。

## 版权说明

歌词文案合集仅供个人挑文案参考，**歌词版权归原作者所有，不可商用**。
产品内所有文案均为按套路原创，不含搬运。
