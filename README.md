# Mcp Server Template

## 开发

### 1. 安装

```bash
pnpm install
```

### 2. 启动

```bash
pnpm dev
```

### 3. 调试

在弹出的 MCP Inspector 跳时网页，选择 SSE 模式并连接，SSE 支持自动重连，更好支持本地开发调试，当然你也可以选择其他模式

### 4. 参数传递

- stdio 模式，可以用 `process.env` 获取 mcp 配置的 env 变量
- see/streamable-http 模式，可以用封装的 ctx.get() 获取 mcp 配置的请求头，方便鉴权等

## 部署 Stdio

### 1. 打包

```bash
pnpm build
```

### 2. 发布到 npm

```bash
pnpm publish
```

### 3. MCP 配置

```json
{
  "mcpServers": {
    "mcp-server-template": {
      "type": "stdio",
      "command": "npx",
      "args": ["mcp-server-template"],
      "env": {
        "API_KEY": "sk-123"
      }
    }
  }
}
```

## 部署 docker

### 1. Build

```bash
docker build -t mcp-server-template .
```

### 2. Run the server

```bash
docker run -p 3000:3000 mcp-server-template
# 或启动 sse
docker run -p 4000:4000 mcp-server-template node sse.js
```

### 3. MCP 配置

```json
{
  "mcpServers": {
    "mcp-server-template": {
      "type": "streamableHttp",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "API_KEY": "sk-123"
      }
    },
    // 或 sse
    "mcp-server-template": {
      "type": "sse",
      "url": "http://localhost:4000/mcp",
      "headers": {
        "API_KEY": "sk-123"
      }
    }
  }
}
```
