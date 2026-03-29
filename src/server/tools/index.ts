import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ctx } from '../context.js'

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'get_weather',
    {
      description: 'Get weather info for a given city.',
      inputSchema: {
        city: z.string().describe('city name'),
      },
    },
    async ({ city }) => {
      if (!city) {
        throw new Error('city name is required.')
      }

      const weather = {
        city: city,
        temperature: Math.floor(Math.random() * 30),
        condition: 'Sunny',
        headers: ctx.safeGet().data?.headers,
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(weather, null, 2),
          },
        ],
      }
    },
  )

  // 添加更多工具注册...
}
