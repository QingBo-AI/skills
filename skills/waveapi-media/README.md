# waveapi-media

Lets your agent find WaveAPI image, video and audio models, read their parameters, price a request, generate, and fetch the result.
让 Agent 直接用 WaveAPI：查模型、读参数、报价、提交生成、取结果。

## Try this · 试试这句

> "用 WaveAPI 列出 5 个视频模型，不要生成内容。"

> "用 seedance-2.0 生成一段 5 秒 720p 的视频：海边日落，镜头缓慢推近。先告诉我价格，我确认后再提交。"

## Setup · 准备

1. 在 WaveAPI 控制台创建一个 API Key。
2. 在终端设置环境变量，不要把 Key 写进命令、对话或文件：

   ```zsh
   read -s "WAVEAPI_API_KEY?WaveAPI API Key: "; echo
   export WAVEAPI_API_KEY
   ```

   Codex 桌面端等图形应用要从 macOS 图形环境读变量，再执行一次 `launchctl setenv WAVEAPI_API_KEY "$WAVEAPI_API_KEY"`，然后重启应用。

3. 需要 Node.js 18 或更高版本。

支持远程 MCP 的客户端也可以不装这个技能，直接连 `https://api.qingbo.ai/v1/mcp`，用同一把 Key 作为 Bearer Token。

## Install · 安装

| You use | Do this |
|---|---|
| Claude Code · Codex · Cursor · Copilot · Gemini CLI … | `npx skills add QingBo-AI/skills --skill waveapi-media` |
| WorkBuddy | Paste `https://github.com/QingBo-AI/skills/tree/main/skills/waveapi-media` and say "install this skill" |
| 豆包 · 元宝 · ChatGPT | Copy [PROMPT.md](./PROMPT.md) into the start of your chat |
