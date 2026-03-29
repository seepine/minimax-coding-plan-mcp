# minimax-coding-plan-mcp

> https://platform.minimaxi.com/docs/token-plan/mcp-guide

MiniMax 模型不支持图片理解，官方提供了 python 版（需安装uvx）的图片理解和网络搜索的 MCP，本项目为官方 MCP 的 Node 版本，使用方法与官方一致

## Stdio MCP 配置

将官方的 `uvx` command 改成 `npx` 或 `bunx` 即可

```json
{
  "mcpServers": {
    "minimax-coding-plan-mcp": {
      "command": "npx",
      "args": ["minimax-coding-plan-mcp", "-y"],
      "env": {
        "MINIMAX_API_KEY": "sk-123_替换成你的TokenPlan API Key",
        "MINIMAX_API_HOST": "https://api.minimaxi.com"
      }
    }
  }
}
```

## SSE/HTTP 支持

例如你的客户端没有 node 和 uv 环境，也可自行部署服务端，通过 SSE/HTTP 方式连接

### 部署服务端

```yml
services:
  minimax-coding-plan-mcp:
    image: seepine/minimax-coding-plan-mcp:latest
    ports:
      - 3000:3000
```

### MCP 配置

```json
{
  "mcpServers": {
    "minimax-coding-plan-mcp": {
      "transport": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "MINIMAX_API_KEY": "sk-123_替换成你的TokenPlan API Key",
        "MINIMAX_API_HOST": "https://api.minimaxi.com"
      }
    }
  }
}
```
