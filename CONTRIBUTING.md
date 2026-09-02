# Contributing · 收录规则与流程

> 给填充者的操作手册。先读 §1 红线，再照 §3 九步走。每个 PR 只会被审一个字段：`SOURCE.md` 里的「原 license」。

---

## 1. 红线（不可协商）

### 能收

- 原仓 license 是 **MIT / Apache-2.0 / BSD-2 / BSD-3 / ISC / CC-BY / CC0 / Unlicense** — 允许再分发
- 原作者**书面授权**（issue 回复、邮件、私信截图）— 截图存到内部法律文档目录，`SOURCE.md` 里注明「作者授权，截图存档 YYYY-MM-DD」

### 不能收

- **没有 LICENSE 文件的仓库** — 默认保留所有权利。「公开在 GitHub 上」≠「可以拿」。这是最常见的坑，别碰
- **GPL / AGPL / LGPL / MPL / SSPL** 系 — 会把整仓拖成同许可。只在 issue 里放链接，不收录
- **CC-BY-NC / CC-BY-ND** — 禁商用或禁改动，不收
- 含个人数据、他人公司内部信息、API key、内部 URL 的
- 原仓 README 明确写「禁止转载」「All rights reserved」的，即使它同时挂了 MIT — 有歧义就不收

### 署名

MIT / Apache / BSD 都**要求保留原版权声明**。做法：`SOURCE.md` 底部把原 LICENSE 全文粘上；skill 的 `README.md` 里一行「Source: @author / repo」。不分区展示，但这两处不能省。

---

## 2. 什么算「清洗」

**只转载不收。** 转载没有价值 — awesome list 已经有一千多个链接了。收进来的每一条至少满足下面三条中的两条：

- 翻译：`description` 中英双写，`README.md` 里有中文示例
- 补齐：补了原作者没写的使用场景、平台差异、常见翻车点
- 验证：在至少一个 agent 里真跑过，`README.md` 的「试试这句」是你跑过的原话

---

## 3. 九步流程（每收一个 skill 走一遍）

1. **查 license** — 打开原仓根目录，找 LICENSE 文件，对照 §1。不在「能收」列表 → 停
2. **装并跑通** — `npx skills add <原仓> --skill <xxx>`，在你的 agent 里真用一次。不好用 → 停，别为了凑数收
3. **定 name** — 按 §4 命名规范。**name = 永久地址，定了不能改**，想清楚再定
4. **建目录** — `skills/<name>/`，从 `templates/` 复制四个文件进去
5. **写 `SOURCE.md`** — 原仓 URL、原作者、原 license、收录日期、你改了什么；底部粘原 LICENSE 全文
6. **清洗 `SKILL.md`** — 保留原逻辑；frontmatter 按 §5 填齐；description 中英双写；示例换成中文用户会遇到的场景
7. **生成 `PROMPT.md`** — 把 SKILL.md 压成一段可直接粘贴的指令：去掉 frontmatter、去掉对文件/工具的引用、合并成连续段落。在豆包或元宝里粘一次确认能用
8. **写 `README.md`** — 一句话是什么 · 「试试这句」× 2 · Source 一行 · 安装矩阵（从模板复制，只换 name）
9. **跑脚本、开 PR** — `node scripts/build-readme.mjs`，然后开 PR，标题 `add: <name>`，PR 模板里的 checklist 打勾

---

## 4. 命名规范

- 小写、连字符、英文；`动作-对象` 或 `对象-场景`；≤ 4 个词
- ✅ `invoice-batch-rename` `meeting-to-actions` `excel-to-report` `pr-review-checklist`
- ❌ `InvoiceTool` `fapiao-zhengli`（拼音）`skill-v2`（版本号）`my-awesome-skill`（废话）
- 和现有 name 撞了 → 加限定词，不加数字：`meeting-to-actions-feishu`

---

## 5. Frontmatter 字段（`SKILL.md` 顶部）

```yaml
---
name: meeting-to-actions              # 必填，= 文件夹名
description: Turn meeting notes into an action list with owners and dates   # 必填，英文一行
description_zh: 把会议记录整理成带负责人和日期的行动清单                          # 建议填
category: office                      # 建议填；随便改，README 会按它分组
tags: [meeting, notes, todo]          # 建议填
source: https://github.com/xxx/yyy    # 收录条目必填；自研留空
---
```

分类现有：`office` `business` `content` `dev` `data` `prompts`。**不够就直接写新的**，脚本会自动建组；想给新分类起中文名，改 `scripts/build-readme.mjs` 顶部的 `CATEGORY_LABELS` 一行。

纯 prompt（不需要 agent 的）：只放 `PROMPT.md`（frontmatter 一样写在 PROMPT.md 顶部）+ `README.md`，不放 `SKILL.md`，`category: prompts`。

---

## 6. 审核

- main 分支受保护，所有改动走 PR
- 审核人只看 `SOURCE.md` 的「原 license」一行是否在 §1「能收」列表内
- 48 小时内审完；超时可以在 PR 里 @ 审核人
- 清洗质量不审 — 不好用的 skill 用户会用脚投票，到时候删

---

## 7. 常见问题

**原仓是一个大合集，我只想收其中一个 skill？** 可以。`SOURCE.md` 里写清楚是哪个子目录，license 以原仓根目录的为准（子目录有自己的 LICENSE 则以子目录为准）。

**原作者是中国人，能不能微信问一句就算授权？** 可以，但要截图，且截图里能看出对方身份和「同意收录」的原话。

**收进来后原作者更新了怎么办？** 不追。`SOURCE.md` 里记的是收录日期那天的版本。有人提 issue 说过时了再更新。

**能不能改原 skill 的核心逻辑？** 能，但 `SOURCE.md` 的「改动」一行要写清楚改了什么。改多了就是你自己的作品，`source` 留空、正文里致谢原作者即可。
