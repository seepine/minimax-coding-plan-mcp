export class MinimaxAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MinimaxAPIError'
  }
}

export class MinimaxRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MinimaxRequestError'
  }
}

export class MinimaxAPIClient {
  private apiKey: string
  private apiHost: string

  constructor(apiKey: string, apiHost: string) {
    this.apiKey = apiKey
    this.apiHost = apiHost
  }

  async post(path: string, body: Record<string, unknown>): Promise<any> {
    const url = `${this.apiHost}${path}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new MinimaxAPIError(
        `API request failed with status ${response.status}: ${response.statusText}`,
      )
    }
    return await response.json()
  }
}
