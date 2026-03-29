import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools } from './tools/index.js'

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'Weather MCP Server',
    version: '0.1.0',
  })

  // 注册工具
  registerTools(server)

  return server
}
