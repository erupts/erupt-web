<p align="center"><img src="./src/assets/logo-light.svg" height="150" alt="logo"/></p>
<h2 align="center">Erupt Engine &nbsp; 🚀 &nbsp; Universal Admin Framework</h2>
<h3 align="center">Frontend Source Code</h3>
<h3 align="center"><a href="https://www.erupt.xyz" target="_blank">https://www.erupt.xyz</a></h3>

---

<h4 align="center">Auto-generates tables, forms and trees from JSON Schema — zero frontend code required</h4>

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
    <a href="https://github.com/erupts/erupt">GitHub</a> &nbsp; | &nbsp;
    <a href="https://gitee.com/erupt/erupt">Gitee</a> &nbsp; | &nbsp;
    <a href="https://www.erupt.xyz" target="_blank"><b>Official Website</b></a> &nbsp; | &nbsp;
    <a href="https://www.erupt.xyz/demo" target="_blank">Live Demo</a> &nbsp; | &nbsp;
    <a href="https://docs.erupt.xyz" target="_blank"><b>Documentation</b></a> &nbsp; | &nbsp;
    <a href="./README.zh.md">中文</a>
</p>

---

## What is this?

This repository is the **frontend** of [Erupt](https://github.com/erupts/erupt), a low-code framework for building enterprise admin systems with Java annotations only.

The Java backend describes each data model (fields, editors, validation, relations, permissions) with `@Erupt` / `@EruptField` annotations and exposes it as JSON Schema. This Angular app consumes that schema at runtime and renders the complete UI — tables, forms, trees, search panels, dialogs — without any hand-written page code.

> **You usually don't need this repo.** The compiled bundle is shipped inside the `erupt-web` Maven artifact, so any Erupt backend already serves the full UI. Clone this project only when you want to customize the frontend itself (branding beyond `app.js`, new field components, deeper theme changes) or contribute to it.

## Features

- **Schema-driven CRUD** — tables, forms, tree views, filters, batch operations and row actions are all generated from backend metadata.
- **Rich field components** — date/time, choice, tag, reference tables, tree selectors, code editor (Monaco), Markdown / rich text (Vditor), attachments, images, maps, auto-complete, and more.
- **Form Designer** — drag-and-drop designer for building `@Erupt` models visually.
- **BI dashboards** — grid-based dashboard builder with charts powered by AntV G2Plot.
- **Cube (OLAP)** — multi-dimensional analysis and drill-down with pivot tables (AntV S2).
- **Workflow** — visual process builder for the Erupt Flow module.
- **AI** — AI-assisted views and interactions.
- **Templates, Monitor, Terminal** — custom template rendering, runtime monitoring and a web terminal (xterm.js).
- **Theming** — runtime dark mode (including OS-follow), compact mode, configurable primary and header colors, and a dark sidebar option.
- **Multi-tab route reuse**, i18n, micro-frontend embedding via `@micro-zoe/micro-app`, PWA-ready.

## Requirements

| Tool    | Version                          |
| ------- | -------------------------------- |
| Node.js | 22.0.0 or higher (`node -v`)     |
| Yarn    | classic (`npm install -g yarn`)  |
| Backend | a running Erupt backend, default `http://localhost:9999` |

## Quick Start

```shell
# 1. Install dependencies (use yarn, not npm)
yarn install

# 2. Point the dev proxy at your backend (default: http://localhost:9999)
#    edit proxy.conf.js -> proxy.target

# 3. Start the dev server (opens the browser automatically)
yarn start
```

All backend paths (`/erupt-api`, `/erupt-attachment`, `/erupt-websocket`, `/erupt-terminal`, …) are proxied to the backend by `proxy.conf.js`, so the app runs on the dev server without CORS configuration.

## Scripts

| Command                 | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `yarn start`            | Dev server with backend proxy and live reload                     |
| `yarn run build`        | Production build (runs Node with a 6 GB heap — the bundle is large) |
| `yarn run analyze`      | Production build with source maps for bundle analysis             |
| `yarn run analyze:view` | Open the bundle analysis in the browser (source-map-explorer)     |
| `yarn run theme`        | Regenerate theme CSS via ng-alain-plugin-theme                    |

There is no test suite in this project.

## Build & Deploy

1. Set the output directory in `angular.json` → `projects.erupt.architect.build.options.outputPath`.
   By default it points at the backend module `erupt-web/src/main/resources/public`, so a build drops straight into the Java project.
2. Run the build:
   ```shell
   yarn run build
   ```
3. Either rebuild the backend so Spring Boot serves the new bundle, or deploy the output as static files behind a reverse proxy that forwards the backend paths listed in `proxy.conf.js`.

The app uses **hash-based routing**, so no server-side rewrite rules are needed.

## Runtime Configuration

Most customization needs no rebuild. `src/app.js` (served as `/app.js`) sets `window.eruptSiteConfig`, which the app reads at startup:

| Key                           | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `domain` / `fileDomain`       | Backend API and attachment base URLs (empty = same origin)   |
| `title` / `desc`              | Page title and login description                             |
| `logoPath` / `logoFoldPath` / `loginLogoPath` / `logoText` | Branding assets                 |
| `theme.primaryColor` / `theme.headerColor` | Default primary color and header bar color      |
| `darkTheme` / `asideDark`     | Default dark mode / dark sidebar (users can override in settings) |
| `tabReuse`                    | Enable multi-tab route reuse by default                      |
| `registerPage`                | URL of a custom registration page shown on the login screen  |
| `copyright` / `copyrightTxt`  | Show the copyright footer / custom footer text               |
| `amapKey` / `amapSecurityJsCode` | AMap credentials for map fields                          |
| `r_tools` / `userTools`       | Custom items in the header's right toolbar and user menu     |
| `upload(files)`               | Override the upload URL and headers                          |

Lifecycle hooks (`startup`, `login`, `logout`) can be attached through `window.eruptEvent`, and per-route load/unload callbacks through `window.eruptRouterEvent`.

`src/app/app.component.ts` also exposes ng-zorro's modal, message and notification services on `window`, so external scripts and template pages can reuse them.

## Project Structure

```
src/
├── app.js                  # Runtime config: window.eruptSiteConfig
├── style-icons-auto.ts     # Icon tree-shaking list (only listed icons are bundled)
├── styles/                 # Global less, design tokens, theme bundles (dark / compact / brutalist)
└── app/
    ├── core/               # Startup init, HTTP interceptors, i18n, singleton services
    ├── shared/             # Shared components, pipes, directives, utils
    ├── layout/             # Layout shells: erupt (main), passport (login), blank
    ├── routes/             # Top-level pages: home, fill-form, exceptions
    └── build/              # Lazy-loaded feature modules
        ├── erupt/          #   Schema-driven CRUD engine (tables, forms, trees, field components)
        ├── designer/       #   Form designer
        ├── bi/             #   Dashboard builder
        ├── cube/           #   OLAP cube analysis
        ├── flow/           #   Workflow builder
        ├── ai/             #   AI features
        ├── tpl/            #   Custom template rendering
        ├── monitor/        #   Runtime monitoring
        └── terminal/       #   Web terminal
```

The heart of the app lives in `src/app/build/erupt/`: `DataService` fetches the model schema, `UIBuildService` maps it to component configuration, and `DataHandlerService` converts data between the API and the form.

## Tech Stack

| Layer      | Libraries                                                        |
| ---------- | ---------------------------------------------------------------- |
| Framework  | Angular 21, TypeScript 5.9, RxJS, Less                            |
| UI         | ng-zorro-antd (Ant Design), ng-alain / @delon                     |
| Data viz   | @antv/g2plot, @antv/s2, angular-gridster2, @worktile/gantt        |
| Editors    | monaco-editor, vditor, UEditor                                    |
| Others     | @micro-zoe/micro-app, @xterm/xterm, @panzoom/panzoom              |

## Repositories

|          | GitHub                              | Gitee                              |
| -------- | ----------------------------------- | ---------------------------------- |
| Backend  | https://github.com/erupts/erupt     | https://gitee.com/erupt/erupt      |
| Frontend | https://github.com/erupts/erupt-web | https://gitee.com/erupt/erupt-web  |

## Contributing

Issues and pull requests are welcome. Please keep code comments in English, use `yarn` for dependency changes, and remember to register any new `nzType` icon in `src/style-icons-auto.ts` — unregistered icons render blank without a build error.

## License

[Apache License 2.0](./LICENSE)
