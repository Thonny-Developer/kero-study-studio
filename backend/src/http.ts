export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}

export const bad = (msg: string, code?: string) => new HttpError(400, msg, code)
