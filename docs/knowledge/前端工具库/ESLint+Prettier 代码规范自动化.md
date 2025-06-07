---
title: ESLint+Prettier 代码规范自动化
date: 2025-05-18 19:17:14
description: 进入团队、协作、开源项目，代码风格就不是你一个人的事了。
publish: true
tags:
  - 代码规范
---

# 代码规范的意义

如果你独自写代码，爱怎么写就怎么写；
但一旦你进入团队、协作、开源项目，代码风格就不是你一个人的事了。风格统一、格式整洁，既是对队友的尊重，也是对后期维护的交代。

经历过“谁动了我的缩进”的 Git 冲突地狱之后，从一开始就把规范配置好是很有必要的，让机器帮我擦屁股，自动格式化、自动校验、自动阻止混乱的代码提交。

这篇笔记记录了我在 Vue 3 项目中完整配置 ESLint + Prettier + VS Code + Git 钩子的过程。目标很简单：**写完就走，不用回头补格式，不担心提交出锅。**

## 项目初始化

使用 Vue 官方脚手架 + pnpm，稳。

```bash
pnpm create vue@latest
```

根据提示，记得勾上：

- ✅ ESLint
- ✅ Prettier

这一步其实已经帮你装好了基础依赖，挺贴心，但还不够。

## 没勾上怎么办？

如果你当时手快没选 ESLint 和 Prettier，也不用重来。直接手动装上缺的依赖就行：

```bash
pnpm add -D eslint prettier eslint-plugin-vue @vue/eslint-config-prettier
```

这几样就是官方选项会帮你自动加的东西，补上就行。

## 补齐必要依赖

项目初始化后，按照惯例先跑一遍依赖安装：

```bash
pnpm install
```

接下来要解决一个常见的“内斗”问题：

- **Prettier** 负责格式化，比如换行、缩进、单双引号；
- **ESLint** 负责规范，比如变量命名、语法限制。

这俩各司其职，但如果不做中间协调，它们很容易打架（你格式化了，ESLint 又嫌弃；你照 ESLint 修了，Prettier 又格式化回来）。

解决办法就是加一个桥梁插件，让 ESLint 去调用 Prettier 的规则：

```bash
pnpm add -D eslint-plugin-prettier
```

装了它之后，ESLint 会“听” Prettier 的，统一风格。

# 配置 ESLint 和 Prettier

项目初期就要定好“规矩”，否则越写越乱，越改越烦。下面是我在 Vue 3 项目中用的配置，删繁就简，但功能齐全，适合小型到中型项目使用。

## ESLint 配置（`eslint.config.js`）

这一段配置干了几件事：

- 启用基本检查规则（ESLint 官方 + Vue）
- 接入 Prettier 做格式化统一
- 排除不该检查的文件夹（如 dist、coverage）
- 禁掉/调低一些 Vue 的烦人规则

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginPrettier from 'eslint-plugin-prettier'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
  // 指定需要 lint 的文件类型
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  // 跳过构建产物等不需要检查的文件
  globalIgnores(['**/dist/**', '**/coverage/**']),

  // 启用浏览器全局变量（如 window、document）
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // 启用官方 JS 推荐规则
  js.configs.recommended,
  // 启用 Vue 的基本检查规则
  ...pluginVue.configs['flat/essential'],
  // 跳过 Vue 配置中自带的 Prettier 格式化
  skipFormatting,

  // 额外插件与规则配置
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // 把 prettier 的格式问题当作 error 报出，确保保存时会自动修复
      'prettier/prettier': 'error',

      // 允许 index.vue 这种单词组件名
      'vue/multi-word-component-names': [
        'warn',
        { ignores: ['index'] },
      ],

      // 允许 setup 中直接解构 props，个人习惯问题
      'vue/no-setup-props-destructure': ['off'],

      // 禁止使用未声明变量
      'no-undef': 'error',
    },
  },
])
```

这一坨记住三件事就够了：

1. **plugin-prettier** 接管格式化：ESLint 不再自己格式化，交给 Prettier；
2. **去除无用规则**：有些 Vue 限制太死，可以按团队习惯关闭；
3. **性能优化**：不检查 `dist/`、`coverage/` 等目录，节省资源。

## Prettier 配置（`.prettierrc.json`）

规则就这么几条，关键是要跟 ESLint 里那份保持一致，否则两边会打架：

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "singleQuote": true,
  "printWidth": 80,
  "trailingComma": "none",
  "endOfLine": "auto"
}
```

项目里 Ctrl+S 一保存能不能自动对齐、单双引号统一，全靠这几行决定。如果和 ESLint 设置冲突，你会发现格式每次都被“打回原形”。

## VS Code 编辑器配合

`.vscode/settings.json` 是你和编辑器“约法三章”的地方，少了它，再完美的配置也白搭：

```json
  // 保存时执行 ESLint 自动修复
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // 禁用 VS Code 自带的格式化（由 ESLint+Prettier 插件处理）
  "editor.formatOnSave": false,

  // 指定默认格式化器（虽然我们禁用了保存时格式化，但手动格式化时会用到）
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // 明确哪些类型的文件要交给 ESLint 检查
  "eslint.validate": ["javascript", "javascriptreact", "vue"],

  // 启用 ESLint 的格式化功能
  "eslint.format.enable": true
```

关键理解就三句：

- 禁用了默认格式化（怕它乱来）
- 一切交给 ESLint 接管，再由它调度 Prettier
- 保存文件就自动修正，一劳永逸

# Git 提交 Husky + lint-staged

只靠保存时修复不够，提交代码前也要再过一遍，不然你总有手贱的时候。

## 初始化 Git 仓库

```bash
git init
```

## 安装 Husky

Husky 可以拦截 Git 钩子，在你 commit 前执行一些检查命令：

```bash
pnpm dlx husky-init
```

这一步做了三件事：

1. 创建 `.husky/` 目录（专放 Git 钩子）
2. 自动添加 `pre-commit` 钩子，默认执行 `pnpm test`
3. 在 `package.json` 里加上一行脚本：

```json
"scripts": {
	"prepare": "husky install"
}
```

> 注意：它并不会安装 `husky` 这个包本身。

接下来我们再使用经典指令补全依赖:

```bash
pnpm install
```

默认的配置存放在`.husky/` 目录，是这样的：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint
```

**问题：** 它会全量检查项目所有代码。项目一大，提交卡成 PPT，还可能因为历史代码报错阻止提交，十分麻烦。

## 改成 lint-staged，只检查暂存区

```bash
pnpm add -D lint-staged
```

这个工具会拦住你提交前的代码，只检查 **Git 暂存区（你 `git add` 过的）文件**，不会浪费时间检查整仓库。

然后在 `package.json` 加配置（建议放在 scripts 后面）：

```json{3,5-9}
{
  "scripts": {
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix"
    ]
  }
}
```

**说明：**

- 先加一个 npm 脚本，方便后续执行
- 配置里指定：只有 js / ts / vue 文件才会跑 `eslint --fix`
- 自动修复能修的，修不了的会直接阻止你提交

接下来，把 `.husky/pre-commit` 改掉：

```bash{4}
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

这一步非常重要。
它执行你定义的 test 脚本——但大多数人项目里没写测试，就会导致你每次提交都报错，纯属折磨人。我们改成 `pnpm lint-staged`，才是真正用于**代码质量兜底**。

这样，每次提交只修你刚改的文件，效率高、体验好。

# 总结

## 自动化开发流程

### 开发时

1. 写代码（不用刻意注意格式）
2. 保存时 ESLint 自动修复
3. 修好之后 VS Code 自动展示结果

### 提交时

1. `git add` 加入暂存区
2. `git commit` 被 Husky 拦下
3. lint-staged 出马，只查你动的文件
4. 修不了的就打回去，保证提交质量

把这一套搞完，虽然一开始要花点时间，但之后你会发现开发体验变得非常清爽。你不需要在格式上花心思，也不用担心提交不合格代码，所有细节都被工具兜住了。

**省脑子，省时间，专心写业务代码就行。**

当然，规范只是起点。工具能兜住格式，兜不住逻辑漏洞。  
写出让人读得懂、愿意维护的代码，靠的还是人。还是我自己。
