import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express, { Request, Response } from 'express'
import { createServer } from './server/index.js'
import { ctx } from './server/context.js'

/**
 * Creates and starts an Express server that provides SSE transport for the MCP Fetch server
 * @param port The port to listen on (defaults to PORT env var or 3000)
 * @param uriPrefix The URI prefix to prepend to all routes (for reverse proxy scenarios)
 * @returns A cleanup function to close the server
 */
export function startSSEServer(
  port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  uriPrefix: string = '',
): () => Promise<void> {
  const app = express()
  let transport: SSEServerTransport
  let server = createServer()

  // Normalize the URI prefix to ensure it starts with a / and doesn't end with one
  const normalizedPrefix = uriPrefix
    ? (uriPrefix.startsWith('/') ? uriPrefix : `/${uriPrefix}`).replace(/\/+$/, '')
    : ''

  // Define the endpoint paths with the prefix
  const ssePath = `${normalizedPrefix}/mcp`
  const messagePath = `${normalizedPrefix}/message`
  const infoPath = `${normalizedPrefix}/info`

  // SSE endpoint for establishing a connection
  app.get(ssePath, async (req: Request, res: Response) => {
    console.info('Received SSE connection from: ', req.headers.host)
    transport = new SSEServerTransport(messagePath, res)
    await server.connect(transport)
  })

  // Endpoint for receiving messages from the c lient
  app.post(messagePath, async (req: Request, res: Response) => {
    console.info('Received SSE message')
    ctx.run(
      {
        headers: req.headers,
      },
      async function () {
        await transport.handlePostMessage(req, res)
      },
    )
  })

  // Basic info endpoint
  app.get(infoPath, (req: Request, res: Response) => {
    res.json({
      name: 'MCP Server',
      version: '0.1.0',
      transport: 'SSE',
      endpoints: {
        sse: ssePath,
        message: messagePath,
        info: infoPath,
      },
    })
  })

  // Start the server
  const httpServer = app.listen(port, () => {
    console.info(`MCP server listening on port ${port}`)
    console.info(`URI prefix: ${normalizedPrefix || '/'} (root)`)
    console.info(`SSE endpoint: http://localhost:${port}${ssePath}`)
    console.info(`Message endpoint: http://localhost:${port}${messagePath}`)
    console.info(`Info endpoint: http://localhost:${port}${infoPath}`)
  })

  // Return a cleanup function
  return async () => {
    console.error('Closing SSE server...')
    httpServer.close()
    if (transport) {
      await server.close()
    }
  }
}

// Start the SSE server
const cleanup = startSSEServer()

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down...')
  await cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down...')
  await cleanup()
  process.exit(0)
})
