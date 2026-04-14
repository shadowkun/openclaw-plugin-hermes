# OpenClaw 插件：Hermes Executor

将任务委托给运行中的 Hermes Agent API 服务器的 OpenClaw 插件。提供健康检查和基于聊天的任务执行工具。

> [!NOTE]
> 本文档的英文版本见 [README.md](./README.md)。

## 插件功能

Hermes Executor 插件连接 OpenClaw 到 Hermes Agent API 服务器，暴露两个工具：

| 工具 | 描述 |
|------|-------------|
| `hermes_status` | 检查 Hermes 网关在 `/health` 端点的响应状态 |
| `hermes_execute` | 通过 `/v1/chat/completions` 发送任务字符串并获取响应文本 |

## 暂未支持的功能

以下功能明确推迟到未来版本：

- 流式响应
- /v1/models 端点
- Webhook 或回调支持
- 自动审批编排
- 会话续接（跨请求传递对话上下文）
- 定时任务
- 多模型路由
- Docker Compose 环境搭建

## 前置条件

### Hermes 安装

1. 安装 Hermes Agent（如未安装）
2. 创建 `~/.hermes/.env` 配置文件
3. 启动 Hermes 网关

### Hermes 配置

创建或编辑 `~/.hermes/.env`：

```bash
# 必须：启用 API 服务器
API_SERVER_ENABLED=true
API_SERVER_KEY=your-secure-api-key-here

# 服务器绑定（本地仅使用 127.0.0.1，外部访问使用 0.0.0.0）
# 警告：如需外部暴露，必须使用安全的 API 密钥
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
```

### 启动 Hermes 网关

```bash
hermes gateway
```

验证 Hermes 运行状态：

```bash
curl -s http://127.0.0.1:8642/health
```

## 安装插件

> [!TIP]
> 对大多数用户，推荐使用发行版包安装（见下文），无需构建或克隆代码。

### 方式一：发行版包（推荐）

**无需构建** — 从 GitHub Releases 下载预编译的 `.tgz` 并直接安装：

1. 访问 [OpenClaw Hermes Releases](https://github.com/shadowkun/openclaw-plugin-hermes/releases)
2. 下载最新版本的 `openclaw-plugin-hermes-1.0.0.tgz` 资源
3. 安装下载的 tarball：

```bash
openclaw plugins install /path/to/openclaw-plugin-hermes-1.0.0.tgz
```

> [!NOTE]
> 将 `/path/to/` 替换为实际保存文件的路径。

验证安装：

```bash
openclaw plugins inspect hermes-executor
```

预期输出显示 status `loaded`，包含工具 `hermes_status` 和 `hermes_execute`。

### 方式二：开发环境搭建（贡献者）

如需修改插件源码或贡献代码：

```bash
# 从源码克隆并构建
git clone https://github.com/shadowkun/openclaw-plugin-hermes.git
cd openclaw-plugin-hermes
npm install
npm run build
```

TypeScript 类型检查：

```bash
npm run typecheck
```

链接已构建的插件：

```bash
openclaw plugins install --link /path/to/openclaw-plugin-hermes
openclaw plugins inspect hermes-executor
```

## 在 OpenClaw 中配置

将插件添加到 OpenClaw 配置的 `plugins.entries` 中。

重要：`hermes_status` 和 `hermes_execute` 是可选插件工具。在 OpenClaw 中，可选插件工具必须由使用它们的代理显式允许。如果跳过下方的白名单步骤，插件可以成功加载，但代理仍然无法看到这些工具。

代理 `main` 的最小工作配置示例：

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": [
            "hermes_status",
            "hermes_execute"
          ]
        }
      }
    ]
  },
  "plugins": {
    "entries": {
      "hermes-executor": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:8642",
          "apiKey": "your-secure-api-key-here",
          "model": "default",
          "timeoutMs": 30000,
          "systemPrompt": "You are a helpful assistant."
        }
      }
    }
  }
}
```

如果代理已有 `tools.alsoAllow` 配置项，请将 Hermes 工具追加到现有条目中，而非替换。

### 配置选项

| 选项 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|----------|---------|-------------|
| `baseUrl` | string | 是 | `http://127.0.0.1:8642` | Hermes 网关基础 URL |
| `apiKey` | string | 是 | - | Bearer 认证令牌 |
| `model` | string | 否 | - | 聊天补全默认模型 |
| `timeoutMs` | number | 否 | `30000` | 请求超时（毫秒） |
| `systemPrompt` | string | 否 | - | 预置于所有请求的系统提示 |

## 使用方法

### 本地 CLI 验证

以下命令在真实本地 OpenClaw 安装（代理 `main`）上验证通过。

#### 1) `hermes_status` 验证证据

本地验证使用的命令：

```bash
openclaw agent --local --agent main --json --timeout 120 --message "You have access to a tool named hermes_status. Call hermes_status now, then respond with only the tool result and no extra commentary."
```

实际运行输出节选：

```text
18:53:14+08:00 [plugins] Hermes executor plugin registered

{
  "payloads": [
    {
      "text": "OK: http://127.0.0.1:8642",
      "mediaUrl": null
    }
  ],
  "meta": {
    "durationMs": 2767,
    "agentMeta": {
      "provider": "llm_studio",
      "model": "google/gemma-4-26b-a4b"
    },
    "systemPromptReport": {
      "sessionKey": "agent:main:main",
      "tools": {
        "entries": [
          { "name": "hermes_status" },
          { "name": "hermes_execute" }
        ]
      }
    },
    "finalAssistantVisibleText": "OK: http://127.0.0.1:8642"
  }
}
```

验证要点：
- 插件在运行时被 OpenClaw 加载
- 本地代理会话可见 `hermes_status` 和 `hermes_execute`
- `hermes_status` 成功连接到 `http://127.0.0.1:8642`

#### 2) `hermes_execute` 验证证据

本地验证使用的命令：

```bash
openclaw agent --local --agent main --json --timeout 180 --message "You have access to a tool named hermes_execute. Call hermes_execute with task='Reply with exactly OPENCLAW_HERMES_OK and nothing else.'. Then respond with only the tool result and no extra commentary."
```

实际运行输出节选：

```text
18:53:57+08:00 [plugins] Hermes executor plugin registered

{
  "payloads": [
    {
      "text": "OPENCLAW_HERMES_OK",
      "mediaUrl": null
    }
  ],
  "meta": {
    "durationMs": 65452,
    "agentMeta": {
      "provider": "llm_studio",
      "model": "google/gemma-4-26b-a4b"
    },
    "systemPromptReport": {
      "sessionKey": "agent:main:main",
      "tools": {
        "entries": [
          { "name": "hermes_status" },
          { "name": "hermes_execute" }
        ]
      }
    },
    "finalAssistantVisibleText": "OPENCLAW_HERMES_OK"
  }
}
```

验证要点：
- 本地 OpenClaw 代理可调用 `hermes_execute`
- Hermes 完成了端到端的确定性非流式请求
- 验证运行时使用的 LM Studio 后备模型路径为 `google/gemma-4-26b-a4b`

注：上述运行的完整原始 JSON 包含更多内容（完整的 `systemPromptReport`、技能清单和工具schema 元数据）。以上片段保留了运行时验证的关键证据：插件注册、可见的 Hermes 工具、provider/model 和最终返回文本。完整记录日志见 [`docs/verification.md`](./docs/verification.md)。

### hermes_status

检查与 Hermes 的连接：

```json
{
  "tool": "hermes_status",
  "input": {}
}
```

成功响应：

```json
{
  "status": "ok",
  "baseUrl": "http://127.0.0.1:8642"
}
```

失败响应：

```json
{
  "status": "error",
  "baseUrl": "http://127.0.0.1:8642",
  "error": "Connection refused"
}
```

### hermes_execute

向 Hermes 发送任务：

```json
{
  "tool": "hermes_execute",
  "input": {
    "task": "What is the capital of France?",
    "context": "Quick factual question"
  }
}
```

| 输入字段 | 类型 | 必填 | 描述 |
|------------|------|----------|-------------|
| `task` | string | 是 | 发送给 Hermes 的用户消息 |
| `context` | string | 否 | 附加上下文，预置到任务前 |
| `model` | string | 否 | 覆盖默认模型 |
| `systemPrompt` | string | 否 | 覆盖默认系统提示 |

响应：

```json
{
  "content": "The capital of France is Paris.",
  "model": "default",
  "finishReason": "stop",
  "usage": {
    "promptTokens": 20,
    "completionTokens": 8,
    "totalTokens": 28
  }
}
```

## 故障排除

### 连接被拒绝

如遇到 `Connection refused` 或 `ECONNREFUSED`：

1. 验证 Hermes 运行中：`curl -s http://127.0.0.1:8642/health`
2. 检查 `~/.hermes/.env` 中的 `API_SERVER_ENABLED=true` 配置
3. 确保防火墙未阻止 8642 端口

### 401 认证错误

如遇到 `401 Unauthorized`：

1. 验证 `apiKey` 与 Hermes .env 中的 `API_SERVER_KEY` 一致
2. 检查 Bearer 令牌是否正确传递到请求中

### 响应内容为空

如果 Hermes 返回成功但 `content` 为空：

1. 检查 Hermes 日志中的实际响应
2. 响应格式可能与预期的 OpenAI 格式不同
3. 模型可能未加载或配置不正确

### 插件未加载

1. 验证配置中的插件 ID 与清单匹配：`hermes-executor`
2. 验证 `package.json` 包含 `"openclaw": { "extensions": ["./dist/index.js"] }`
3. 确保构建成功完成：`npm run build`

### 插件已加载但代理无法看到工具

如果 `openclaw plugins inspect hermes-executor` 显示插件已加载，但 `openclaw agent --local --agent main ...` 提示工具不可用：

1. 将 `hermes_status` 和 `hermes_execute` 添加到该代理的 `tools.alsoAllow`
2. 重新运行 `openclaw agent --local --agent main ...` 命令
3. 确认 JSON 输出的工具列表包含两个 Hermes 工具

## 项目结构

```
openclaw-plugin-hermes/
├── openclaw.plugin.json   # 插件清单
├── package.json          # NPM 包配置
├── tsconfig.json         # TypeScript 配置
├── src/
│   ├── index.ts        # 插件入口
│   ├── config.ts      # 配置验证
│   ├── types.ts      # 共享类型定义
│   ├── hermes-client.ts # Hermes HTTP 客户端
│   └── tools/
│       ├── hermes-status.ts   # hermes_status 工具
│       └── hermes-execute.ts  # hermes_execute 工具
├── dist/              # 编译输出
└── examples/
    ├── openclaw.config.jsonc
    └── hermes.env.example
```

## 相关文档

- [英文 README](./README.md) - English version
- [验证日志](./docs/verification.md) - 完整本地验证记录
- [贡献指南](./CONTRIBUTING.md)
- [安全策略](./SECURITY.md)
- [更新日志](./CHANGELOG.md)
- [许可证](./LICENSE)

## 许可证

MIT
