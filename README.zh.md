<p align="center"><img src="./src/assets/logo-light.svg" height="150" alt="logo"/></p>
<h2 align="center">Erupt Engine &nbsp; 🚀 &nbsp; 通用后台管理框架</h2>
<h3 align="center">前端源码</h3>
<h3 align="center"><a href="https://www.erupt.xyz" target="_blank">https://www.erupt.xyz</a></h3>

---

<h4 align="center">通过 JSON Schema 自动构建表格、表单与树，实现零前端代码开发</h4>

---

<p align="center">
    <a href="https://www.erupt.xyz" target="_blank"><img src="https://img.shields.io/badge/Erupt-Framework-brightgreen" alt="Erupt Engine"></a>
    <a href="https://mvnrepository.com/search?q=erupt"><img src="https://img.shields.io/maven-central/v/xyz.erupt/erupt" alt="maven-central"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-21-dd0031.svg" alt="Angular 21"></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-22+-339933.svg" alt="Node.js 22+"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202-blue" alt="license Apache 2.0"></a>
    <a href="https://gitee.com/erupt/erupt"><img src="https://gitee.com/erupt/erupt/badge/star.svg?theme=dark" alt="Gitee star"></a>
    <a href="https://github.com/erupts/erupt"><img src="https://img.shields.io/github/stars/erupts/erupt?style=social" alt="GitHub stars"></a>
</p>

<p align="center">
    <a href="https://github.com/erupts/erupt">Github 仓库</a> &nbsp; | &nbsp;
    <a href="https://gitee.com/erupt/erupt">码云仓库</a> &nbsp; | &nbsp;
    <a href="https://www.erupt.xyz" target="_blank"><b>🦅 官方网站</b></a> &nbsp; | &nbsp;
    <a href="https://www.erupt.xyz/demo" target="_blank">在线体验</a> &nbsp; | &nbsp;
    <a href="https://docs.erupt.xyz" target="_blank"><b>📕 使用文档</b></a> &nbsp; | &nbsp;
    <a href="./README.md">English</a>
</p>

---

## 项目简介

本仓库是 [Erupt](https://github.com/erupts/erupt) 的**前端源码**。Erupt 是一个低代码框架，只需 Java 注解即可构建企业级后台管理系统。

Java 后端通过 `@Erupt` / `@EruptField` 等注解描述数据模型（字段、编辑器、校验、关联关系、权限），并以 JSON Schema 形式对外暴露。本 Angular 应用在运行时读取该 Schema，自动渲染出完整的界面：表格、表单、树、查询面板、弹窗等，无需手写任何页面代码。

> **通常你不需要克隆本仓库。** 编译后的前端产物已随 `erupt-web` Maven 依赖一并发布，任何 Erupt 后端启动后即可直接使用完整界面。只有在需要深度定制前端（`app.js` 之外的品牌定制、新增字段组件、更深层的主题改动）或参与贡献时，才需要本项目。

## 功能特性

- **Schema 驱动的 CRUD** — 表格、表单、树形视图、筛选、批量操作、行内操作全部由后端元数据生成。
- **丰富的字段组件** — 日期时间、选择、标签、引用表、树选择、代码编辑器（Monaco）、Markdown / 富文本（Vditor）、附件、图片、地图、自动补全等。
- **表单设计器** — 拖拽式可视化设计 `@Erupt` 模型。
- **BI 仪表盘** — 基于栅格布局的仪表盘构建器，图表由 AntV G2Plot 驱动。
- **Cube 多维分析** — OLAP 多维分析与下钻，透视表基于 AntV S2。
- **工作流** — Erupt Flow 模块的可视化流程设计器。
- **AI** — AI 辅助视图与交互。
- **模板 / 监控 / 终端** — 自定义模板渲染、运行时监控与 Web 终端（xterm.js）。
- **主题** — 运行时夜间模式（支持跟随系统）、紧凑模式、可配置主色与顶栏颜色、深色侧边栏。
- **多页签路由复用**、国际化、基于 `@micro-zoe/micro-app` 的微前端嵌入、支持 PWA。

## 环境要求

| 工具    | 版本                                    |
| ------- | --------------------------------------- |
| Node.js | 22.0.0 或更高（`node -v` 查看）          |
| Yarn    | classic 版本（`npm install -g yarn`）    |
| 后端    | 一个运行中的 Erupt 后端，默认 `http://localhost:9999` |

## 快速开始

```shell
# 1. 安装依赖（请使用 yarn，不要使用 npm）
yarn install

# 2. 将开发代理指向你的后端（默认 http://localhost:9999）
#    修改 proxy.conf.js -> proxy.target

# 3. 启动开发服务器（自动打开浏览器）
yarn start
```

所有后端路径（`/erupt-api`、`/erupt-attachment`、`/erupt-websocket`、`/erupt-terminal` 等）都由 `proxy.conf.js` 代理到后端，开发时无需配置跨域。

## 常用脚本

| 命令                    | 说明                                                  |
| ----------------------- | ----------------------------------------------------- |
| `yarn start`            | 启动开发服务器，带后端代理与热更新                    |
| `yarn run build`        | 生产构建（Node 堆内存设为 6 GB，产物较大）             |
| `yarn run analyze`      | 带 source map 的生产构建，用于分析包体积               |
| `yarn run analyze:view` | 在浏览器中查看包体积分析（source-map-explorer）         |
| `yarn run theme`        | 通过 ng-alain-plugin-theme 重新生成主题 CSS            |

本项目没有测试套件。

## 构建与部署

1. 在 `angular.json` 中设置输出目录：`projects.erupt.architect.build.options.outputPath`。
   默认指向后端模块 `erupt-web/src/main/resources/public`，构建产物会直接落到 Java 项目中。
2. 执行构建：
   ```shell
   yarn run build
   ```
3. 重新打包后端，让 Spring Boot 提供新的前端资源；或者将产物作为静态文件部署，并通过反向代理转发 `proxy.conf.js` 中列出的后端路径。

应用使用 **hash 路由**，无需服务端 rewrite 规则。

## 运行时配置

大多数定制无需重新构建。`src/app.js`（以 `/app.js` 提供）定义了 `window.eruptSiteConfig`，应用启动时读取：

| 配置项                        | 说明                                                   |
| ----------------------------- | ------------------------------------------------------ |
| `domain` / `fileDomain`       | 后端接口与附件的基础地址（留空表示同源）               |
| `title` / `desc`              | 页面标题与登录页描述                                   |
| `logoPath` / `logoFoldPath` / `loginLogoPath` / `logoText` | 品牌 Logo 与文字            |
| `theme.primaryColor` / `theme.headerColor` | 默认主色与顶栏颜色                        |
| `darkTheme` / `asideDark`     | 默认夜间模式 / 深色侧边栏（用户可在设置面板中覆盖）    |
| `tabReuse`                    | 默认开启多页签路由复用                                 |
| `registerPage`                | 登录页显示的自定义注册页地址                           |
| `copyright` / `copyrightTxt`  | 是否显示版权信息 / 自定义版权文案                      |
| `amapKey` / `amapSecurityJsCode` | 地图字段使用的高德地图凭证                         |
| `r_tools` / `userTools`       | 顶栏右侧工具栏与用户菜单中的自定义项                   |
| `upload(files)`               | 覆盖上传地址与请求头                                   |

生命周期钩子（`startup`、`login`、`logout`）可通过 `window.eruptEvent` 挂载，路由级 load / unload 回调可通过 `window.eruptRouterEvent` 挂载。

`src/app/app.component.ts` 还将 ng-zorro 的 modal、message、notification 服务挂到了 `window` 上，外部脚本与模板页面可以直接复用。

## 目录结构

```
src/
├── app.js                  # 运行时配置：window.eruptSiteConfig
├── style-icons-auto.ts     # 图标按需打包清单（只有列出的图标会被打包）
├── styles/                 # 全局 less、设计 token、主题包（dark / compact / brutalist）
└── app/
    ├── core/               # 启动初始化、HTTP 拦截器、国际化、单例服务
    ├── shared/             # 共享组件、管道、指令、工具
    ├── layout/             # 布局壳：erupt（主界面）、passport（登录）、blank
    ├── routes/             # 顶层页面：首页、fill-form、异常页
    └── build/              # 懒加载功能模块
        ├── erupt/          #   Schema 驱动的 CRUD 引擎（表格、表单、树、字段组件）
        ├── designer/       #   表单设计器
        ├── bi/             #   仪表盘构建器
        ├── cube/           #   OLAP 多维分析
        ├── flow/           #   工作流设计器
        ├── ai/             #   AI 功能
        ├── tpl/            #   自定义模板渲染
        ├── monitor/        #   运行时监控
        └── terminal/       #   Web 终端
```

核心逻辑位于 `src/app/build/erupt/`：`DataService` 获取模型 Schema，`UIBuildService` 将其映射为组件配置，`DataHandlerService` 负责接口数据与表单数据之间的转换。

## 技术栈

| 层次       | 依赖库                                                           |
| ---------- | ---------------------------------------------------------------- |
| 框架       | Angular 21、TypeScript 5.9、RxJS、Less                            |
| UI         | ng-zorro-antd（Ant Design）、ng-alain / @delon                    |
| 数据可视化 | @antv/g2plot、@antv/s2、angular-gridster2、@worktile/gantt        |
| 编辑器     | monaco-editor、vditor、UEditor                                    |
| 其他       | @micro-zoe/micro-app、@xterm/xterm、@panzoom/panzoom              |

## 代码仓库

|          | Github                              | 码云                               |
| -------- | ----------------------------------- | ---------------------------------- |
| 后端源码 | https://github.com/erupts/erupt     | https://gitee.com/erupt/erupt      |
| 前端源码 | https://github.com/erupts/erupt-web | https://gitee.com/erupt/erupt-web  |

## 参与贡献

欢迎提交 Issue 与 Pull Request。请使用英文书写代码注释，使用 `yarn` 管理依赖变更，新增 `nzType` 图标时记得在 `src/style-icons-auto.ts` 中注册，未注册的图标会静默渲染为空白而不会报构建错误。

## 开源协议

[Apache License 2.0](./LICENSE)
