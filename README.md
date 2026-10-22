# 飞象 AI 题库工作台新首页

一个独立、可运行的 Web 桌面端产品原型，用统一编辑画布承接练习册、试卷、题单、AI 录题、AI 组题与 AI 改编。

## 终端与预览

- 终端：Web 桌面端
- 推荐宽度：1440px 及以上
- 最小布局宽度：1280px；更窄时按飞象线上规则裁切，不做移动端回流

## 本地启动

```bash
npm install
npm run dev
```

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，Vite 已设置 `base: './'`，可以打包后放到任意静态目录预览。

## 分享方式

1. 本地评审：运行 `npm run dev`，打开终端显示的地址。
2. 文件评审：运行 `npm run build`，压缩 `dist/` 后发给评审人。
3. 新链接发布：评审通过后创建全新的站点身份与链接；禁止复用工作区内任何已有 `.openai/hosting.json`。

## 目录说明

```text
src/
├── components/       产品级组合组件
├── data/             本地 mock 数据
├── design-system/    飞象 token、骨架与 zoom 适配
├── hooks/            工作台状态与交互控制
├── pages/            页面编排
├── prototype/        领域数据类型
└── services/         可替换的 mock 服务边界
```

## 当前原型范围

- 已实现：独立新首页、空画布、添加内容抽屉、资源追加、AI 组题、题目选择、AI 改编、排序、保存/布置/打印反馈。
- 本地 mock：资源加载、文件识别、AI 生成与改编、保存和输出。
- 尚未接入：API、鉴权、权限、真实上传、真实 AI、打印/PDF、埋点和线上发布。
