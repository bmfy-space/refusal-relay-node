# Refusal Relay

Refusal Relay 是一个基于 Express 的轻量代理服务，用于转发兼容 OpenAI 风格的上游接口请求，并在检测到模型拒绝响应时自动改写上下文后重试请求。

## 功能特性

- 代理以下接口：
  - `POST /v1/chat/completions`
  - `POST /chat/completions`
  - `POST /v1/responses`
  - `POST /responses`
  - `POST /v1/messages`
  - `POST /messages`
- 支持 `Authorization: Bearer <token>` 和 `x-api-key` 两种客户端鉴权方式
- 自动转发到单个上游接口
- 检测普通 JSON 与 SSE 流式响应中的拒绝文本
- 命中拒绝时自动：
  - 将最后一条 assistant 拒绝内容替换为一条接受式回复
  - 追加一条用户消息 `继续`
  - 重试上游请求
- 超过最大重试次数后，返回本地构造的接受式成功响应
- 提供基础状态接口：`GET /`、`GET /health`、`GET /v1/models`

## 项目结构

```text
v2-nodejs/
├─ src/
│  ├─ builders/
│  ├─ config/
│  ├─ middleware/
│  ├─ routes/
│  ├─ services/
│  └─ utils/
├─ .env.example
├─ .gitignore
├─ package.json
└─ README.md
```

## 环境变量

创建 `.env` 文件：

```env
UPSTREAM_BASE_URL=https://your-upstream.example.com
UPSTREAM_API_KEY=your-upstream-api-key
AUTH_TOKENS=your-client-token
PORT=8000
```

说明：

| 变量 | 必填 | 说明 |
|---|---|---|
| `UPSTREAM_BASE_URL` | 是 | 上游接口基础地址 |
| `UPSTREAM_API_KEY` | 是 | 上游 Bearer Token |
| `AUTH_TOKENS` | 否 | 客户端访问令牌，多个值用英文逗号分隔 |
| `PORT` | 否 | 本地服务监听端口，默认 `8000` |

## 安装与启动

```bash
npm install
npm start
```

启动后默认监听：

```text
http://127.0.0.1:8000
```

如果你修改了 `.env` 中的 `PORT`，请按对应端口访问。

## 部署到 Vercel

本项目已适配 Vercel：

- 本地开发仍通过 `src/server.js` 启动并监听 `PORT`
- Vercel 线上通过根目录 `index.js` 导出 Express app
- Vercel 部署时不需要手动设置监听端口

在 Vercel 项目中配置以下环境变量：

| 变量 | 必填 | 说明 |
|---|---|---|
| `UPSTREAM_BASE_URL` | 是 | 上游接口基础地址 |
| `UPSTREAM_API_KEY` | 是 | 上游 Bearer Token |
| `AUTH_TOKENS` | 否 | 客户端访问令牌，多个值用英文逗号分隔 |

说明：`PORT` 仅用于本地开发，Vercel 线上无需设置。

## 可用接口

### 1. 健康检查

```http
GET /health
```

返回示例：

```json
{"status":"ok"}
```

### 2. 服务信息

```http
GET /
```

### 3. 模型列表

```http
GET /v1/models
```

### 4. 代理接口

```http
POST /v1/chat/completions
POST /chat/completions
POST /v1/responses
POST /responses
POST /v1/messages
POST /messages
```

## 工作机制

当请求被转发到上游后，服务会检查响应内容是否命中拒绝模式。

如果命中：
1. 找到最后一条 assistant 消息
2. 将其内容替换为一条随机接受式语句
3. 追加一条用户消息 `继续`
4. 重新向上游发送请求
5. 重复直到成功或达到最大重试次数

## 注意事项

- 本项目当前仅支持单上游配置
- 不包含管理后台和 YAML 配置系统
- `.env` 中通常包含真实密钥，请勿提交到版本库
- 如果端口被占用，请修改 `PORT` 后重新启动