# Shopify Template

这是一个用于新建 Shopify Online Store 主题项目的基础模板。它的目标不是只复制一套页面样式，而是把 Shopify 数据建模、主题开发、交互验证、权限管理和交付检查固化下来，减少每个新项目中的重复人工操作。

本模板目前以项目规范为核心：

- `AGENTS.md`：给 Codex、自动化脚本和其他开发代理使用的详细工程规则。
- `README.md`：给项目开发者阅读的初始化和交付说明。

`AGENTS.md` 是自动化执行时的权威规则。README 只解释如何使用模板，不替代其中的安全约束。

## 模板边界

这个项目刻意保持轻量。它是一个 Shopify Theme 起始模板和一组最小检查，
不是完整的 Shopify Framework。当前只固化已经在真实项目中反复出现的问题：

- 最小 Theme 骨架
- 忽略的环境文件和 `.env.example`
- store / scope 校验
- 轻量 Admin GraphQL helper
- 最小 storefront Playwright smoke test
- 基础 Theme Check、JavaScript 和 JSON 检查

暂不在模板中加入 `sync-collections`、通用资源同步框架、Service/Repository
抽象或完整视觉回归平台。只有同一个问题至少在两个真实项目中重复出现，且
解决方式稳定后，才考虑提升为模板能力。

## 核心数据链路

主题不应该自己维护一套商品分类或导航数据库。推荐的数据关系是：

```text
Product attributes
        |
        v
Automated Collections
        |
        v
Shopify Menus
        |
        v
Theme navigation
        |
        v
Collection product grid
```

商品分类应落在 Shopify Products 的 tags、product type 或 metafields 中；集合使用规则自动收录商品；菜单指向真实 Collection；Liquid 从 Shopify 对象渲染页面。

## 预期目录结构

使用 Shopify CLI 初始化主题或应用后，建议保持下面的职责边界：

```text
.
├── AGENTS.md
├── README.md
├── theme/                 # Shopify Online Store theme
├── shopify-app/           # 可选：Admin API、Metaobjects、内容同步应用
├── scripts/               # dry-run、同步、审计和导入脚本
├── tests/                 # 交互和数据回归测试
├── references/            # 原站截图、页面结构和参考资料
└── output/                # 生成的审计报告、截图和 QA 产物
```

不要把 token、密码、`.env` 文件、浏览器缓存或无必要的大型生成媒体放进仓库。

## 新项目初始化

1. 从本模板创建项目副本，并确认目标 Shopify 店铺域名。
2. 使用 Shopify CLI 初始化 `theme/`，需要后台资源同步时再创建 `shopify-app/`。
3. 创建本地未跟踪的 `.env.local`，只保存当前项目所需的店铺和 App 配置。不要把凭据发到聊天中或写入脚本。
4. 为所有 mutation 脚本设置显式 `--store`，先执行 dry-run，再进行写入。
5. 先确认 `currentAppInstallation.accessScopes`，不要仅根据本地 `shopify.app.toml` 判断权限已经生效。
6. 默认使用 Draft/Development Theme，完成验证后再由用户决定是否发布。

推荐的第一次检查：

```bash
shopify theme check --path theme
node --check theme/assets/theme.js
git diff --check
```

如果项目没有 `theme/assets/theme.js`，将命令替换为实际被修改的 JavaScript 文件。

## 开发流程

### 1. 先确认边界

开始任何写入前，记录：

- Store domain
- App identity
- 已安装 scopes
- Draft Theme ID
- 需要使用的 publication/channel
- 本次是否允许修改线上资源

Shopify CLI 负责 App/theme 生命周期；Admin GraphQL 负责 Products、Collections、Menus、Publications、Pages、Articles 和 Metaobjects 等资源；不要混用身份。需要通过浏览器访问 Shopify Admin 时，必须使用已登录的 SunBrowser，不要切换到 IAB 或其他浏览器 profile。

### 2. 建立原生 Shopify 数据

- 使用标准化小写 tags，例如 `gender:women`、`category:clothing`、`subcategory:pants`。
- 保留既有商品标签和 metafields，只补充确定的分类属性。
- 使用 Automated Collections，不要在 Liquid 或 JavaScript 中维护商品 ID 列表。
- 更新已有 Menu 时优先按 handle 查找并幂等更新，不要重复创建菜单。
- Collection 和商品的 `ACTIVE` 状态不等于已发布到 Online Store，必须单独执行并验证 publication。
- Metaobject schema 先部署，再创建 entries；记录远程 Definition GID 和具体部署类型。

### 3. 实现主题

- Header、Mega Menu 和移动菜单使用 `section.settings.menu.links`、`link.links`、`link.url` 和 `link.object`。
- Collection 页面使用 `collection.products`，保留 Shopify 原生排序、筛选、分页、库存、价格和 PDP 链接。
- 变体逻辑使用 `product.variants`、`variant.options`、`variant.featured_media` 和 `selected_or_first_available_variant`。
- 不根据图片文件名猜测颜色或变体关系；同时考虑 `Color` 和 `Colour`。
- 可选 Metaobject 为空时，回退到原生 Shopify 对象，不让页面因为内容配置缺失而崩溃。

### 4. 做真实交互验证

如果需要复刻参考站，不要只根据静态截图实现动画。先使用 Playwright 或 DevTools 记录原站和 Draft Preview 的：

- 默认、hover、focus、active、展开、收起和滚动状态
- 触发方式、尺寸、位置、opacity、transform、z-index、overflow 和 pointer-events
- transition property、duration、delay、easing
- Desktop 与 390x844 Mobile 的差异

持续维护 `interaction-audit.md`，并对 Header、Mega Menu、Product Card、Gallery、Variant、Filter、Drawer、Accordion、Carousel 和 Footer 做同动作回归。验收同时检查 Behavior、Motion、Geometry 和 Responsive Match。

## 常用命令

### App 或 schema 变更

```bash
shopify app build
shopify app deploy --allow-updates
```

App scope 更新后，已有安装通常还需要重新授权；部署成功并不代表旧 token 已经拥有新权限。

### Theme 变更

```bash
shopify theme check --path theme
shopify theme dev \
  --store <store>.myshopify.com \
  --path theme \
  --theme <draft-theme-id>
```

除非用户明确要求，不要把 `--theme` 替换为 Live Theme，也不要在验证前执行发布。

### 修改前后的静态检查

```bash
node --check <changed-javascript-file>
git diff --check
```

JSON 模板、Liquid schema 和脚本输出也应在提交前解析或执行 dry-run。

### Store 和 scope 校验

将 `.env.example` 复制为 `.env.local` 并填入当前项目的 Admin token 后，可以直接运行：

```bash
npm run verify:shopify -- \
  --store <store>.myshopify.com \
  --require-scope read_products
```

命令只输出店铺、API 版本、已安装 scopes 和缺失 scopes，不会输出 token。

## 常见问题

### 新增 scope 后 API 仍然拒绝

检查顺序：

1. `shopify.app.toml` 是否包含所需 scope。
2. 是否完成 `shopify app build` 和 `shopify app deploy --allow-updates`。
3. 当前店铺的 `currentAppInstallation.accessScopes` 是否真的更新。
4. 是否需要在已登录的 SunBrowser 会话中完成重新授权。

不要通过换用另一个项目的 token 来绕过权限问题。

### Mega Menu 的隐藏面板全部显示

主题 CSS 可能用 `display:grid` 覆盖浏览器默认的 `[hidden]` 行为。为隐藏状态添加足够明确的规则，并测试打开一个面板后其他面板仍然不可见。

### 移动端 Drawer 高度只有几十像素

绝对定位的内部内容可能让容器塌缩。Drawer 外层应有 `inset: 0` 和 `min-height: 100dvh`，关闭时同时恢复 `aria-hidden`、backdrop 和 `body { overflow: hidden }`。

### `Default Title` 导致变体无法验证

单 variant 商品不能证明真实的 option、media、price 和 URL 联动。优先寻找现有多 variant 商品；确实没有时，再用稳定 handle 创建带 QA 标记的 fixture，并在 mutation 前验证 `write_products` 和 publication scopes。

### Theme Check 或 Theme Dev 卡住

先检查是否有残留的 `theme dev`、`git` 或 CLI 进程占用文件。Theme Check 暂时不可用时，要明确记录工具阻塞，并继续执行 JavaScript、JSON、Liquid、API 和浏览器验证；不要把未运行的检查报告为通过。

### Git push 很慢或挂起

先检查 stale Git 进程、`.git/index.lock` 和大型对象。确认 `.gitignore` 没有漏掉缓存、截图和生成媒体；确实需要跟踪的大文件使用 Git LFS。推送后核验远程 commit hash 和仓库可见性。

## 交付前检查清单

- [ ] Store、App identity、scopes 和 Theme ID 已记录。
- [ ] 所有 mutation 都有显式 store、dry-run 或可审计输出。
- [ ] Products、Collections、Menus、Metaobjects、Pages 和 Publications 已通过 API 复核。
- [ ] Theme Check、JavaScript、JSON 和 `git diff --check` 已执行。
- [ ] Desktop 和 390x844 Mobile 已完成关键路径验证。
- [ ] 变体、排序、筛选、分页、导航和 PDP 链接已验证。
- [ ] 已明确测试的是 Draft Theme 还是 Live Theme。
- [ ] 没有提交凭据、密码、token、缓存或无必要的大型生成文件。
- [ ] 剩余的手动授权、登录、发布或外部依赖已写入交付说明。

## 相关文件

- [AGENTS.md](AGENTS.md)：自动化代理的完整工程规则。
- `interaction-audit.md`：原站与 Draft Preview 的交互审计记录。
- `scripts/`：应当默认 dry-run、显式指定店铺并输出结构化审计结果。
