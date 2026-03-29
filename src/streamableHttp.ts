import express, { Request, Response } from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createServer } from './server/index.js'
import crypto from 'crypto'
import { ctx } from './server/context.js'

/**
 * 生成sessionId，实际可以根据API-KEY或者token来生成
 */
const sessionIdGenerator = (req: Request) => {
  let token = req.header('authorization')
  if (token) {
    return token.startsWith('Bearer ') ? token.slice(7) : token
  }
  token = req.header('api-key')
  if (token) {
    return token
  }
  const userAgent = req.header('user-agent')
  const ip = req.header('x-forwarded-for') || req.ip
  return crypto
    .createHash('md5')
    .update(`${userAgent || crypto.randomUUID()}-${ip || 'unknown'}`)
    .digest('hex')
}

const app = express()
app.use(express.json())

const map = new Map<
  string,
  {
    server: McpServer
    transport: StreamableHTTPServerTransport
    time: number
  }
>()

setInterval(() => {
  const now = Date.now()
  for (const [sessionId, item] of map) {
    // 超过20分钟未活动，关闭连接
    if (now - item.time > 1000 * 60 * 20) {
      item.server.close()
      item.transport.close()
      map.delete(sessionId)
    }
  }
}, 1000 * 60)

const useTransport = async (req: Request, res: Response) => {
  const sessionId = sessionIdGenerator(req)
  const get = map.get(sessionId)
  if (get) {
    if (req.body.method !== 'initialize') {
      return get.transport
    }
    await get.server.close()
    await get.transport.close()
    map.delete(sessionId)
  }
  const server: McpServer = createServer()
  const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId,
    onsessioninitialized(sessionId) {
      console.log('初始化sessionId', sessionId)
    },
    onsessionclosed(sessionId) {
      map.delete(sessionId)
    },
  })
  await server.connect(transport)
  map.set(sessionId, {
    server,
    transport,
    time: Date.now(),
  })
  return transport
}

app.post('/mcp', async (req: Request, res: Response) => {
  ctx.run(
    {
      headers: req.headers,
    },
    async () => {
      try {
        const transport = await useTransport(req, res)
        await transport.handleRequest(req, res, req.body)
      } catch (error) {
        console.error('Error handling MCP request:', error)
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: 'Internal server error' },
            id: null,
          })
        }
      }
    },
  )
})

const methodNotAllowed = async (req: Request, res: Response) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    }),
  )
}
app.get('/mcp', methodNotAllowed)
app.delete('/mcp', methodNotAllowed)

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, (error) => {
  if (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
  console.log(`Weather MCP Server listening on port ${PORT}`)
  console.log(`URI prefix: /mcp`)
  console.log(`The endpoint: http://localhost:${PORT}/mcp`)
})
