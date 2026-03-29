import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ctx } from '../context.js'
import { MinimaxAPIClient, MinimaxAPIError, MinimaxRequestError } from './types.js'
import { processImageUrl } from './utils.js'

const MINIMAX_API_KEY = process.env['MINIMAX_API_KEY']
const MINIMAX_API_HOST = process.env['MINIMAX_API_HOST']

const createClient = () => {
  let miniMaxApiKey
  let miniMaxApiHost

  const context = ctx.safeGet()
  if (context.success) {
    const headers = context.data.headers
    miniMaxApiKey =
      headers['minimax_api_key']?.toString().trim() ||
      headers['minimax-api-key']?.toString().trim() ||
      MINIMAX_API_KEY
    miniMaxApiHost =
      headers['minimax_api_host']?.toString().trim() ||
      headers['minimax-api-host']?.toString().trim() ||
      MINIMAX_API_HOST
  } else {
    miniMaxApiKey = MINIMAX_API_KEY
    miniMaxApiHost = MINIMAX_API_HOST
  }

  if (!miniMaxApiKey) {
    throw new MinimaxAPIError('MINIMAX_API_KEY env or header cannot be empty')
  }

  const apiClient = new MinimaxAPIClient(
    miniMaxApiKey,
    miniMaxApiHost || 'https://api.minimaxi.com',
  )
  return apiClient
}

export const registerTools = (server: McpServer) => {
  server.registerTool(
    'web_search',
    {
      description: `You MUST use this tool whenever you need to search for real-time or external information on the web.

A web search API that works just like Google Search.

Args:
    query (str): The search query. Aim for 3-5 keywords for best results. For time-sensitive topics, include the current date (e.g. \`latest iPhone 2025\`).

Search Strategy:
    - If no useful results are returned, try rephrasing your query with different keywords.

Returns:
    A JSON object containing the search results.`,
      inputSchema: {
        query: z.string().describe('The search query. Aim for 3-5 keywords for best results.'),
      },
    },
    async ({ query }) => {
      if (!query) {
        throw new MinimaxRequestError('Query is required')
      }

      const payload = { q: query }

      const apiClient = createClient()
      const responseData = await apiClient.post('/v1/coding_plan/search', payload)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      }
    },
  )

  server.registerTool(
    'understand_image',
    {
      description: `You MUST use this tool whenever you need to analyze, describe, or extract information from an image.

An LLM-powered vision tool that can analyze and interpret image content from local files or URLs based on your instructions.
Only JPEG, PNG, and WebP formats are supported.

Args:
    prompt (str): A text prompt describing what you want to analyze or extract from the image.
    image_source (str): The location of the image to analyze.
        - HTTP/HTTPS URL: "https://example.com/image.jpg"
        - Local file path (relative or absolute)
        - If path starts with @, strip the @ prefix before passing`,
      inputSchema: {
        prompt: z
          .string()
          .describe('A text prompt describing what you want to analyze or extract from the image.'),
        image_source: z
          .string()
          .describe('The location of the image to analyze (URL or local file path).'),
      },
    },
    async ({ prompt, image_source }) => {
      if (!prompt) {
        throw new MinimaxRequestError('Prompt is required')
      }
      if (!image_source) {
        throw new MinimaxRequestError('Image source is required')
      }

      const apiClient = createClient()

      const processedImageUrl = await processImageUrl(image_source.trim())
      const payload = {
        prompt,
        image_url: processedImageUrl,
      }
      const responseData: {
        content: string
        base_resp: {
          status_code: number
          status_msg: string
        }
      } = await apiClient.post('/v1/coding_plan/vlm', payload)
      const content = responseData.content as string

      if (!content) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                'Understand Image Failed: No content returned from VLM API, error message:\n' +
                JSON.stringify(responseData.base_resp, null, 2),
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      }
    },
  )
}
