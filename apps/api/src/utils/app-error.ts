export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly meta: Record<string, unknown> | undefined;

  constructor(statusCode: number, code: string, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
  }
}
