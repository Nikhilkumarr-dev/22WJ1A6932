import type { Request, Response, NextFunction } from "express"
import { Logger } from "../../../loggingMiddleware"

export class ErrorHandler {
  static async handle(error: Error, req: Request, res: Response, next: NextFunction): Promise<void> {
    await Logger.error("handler", `Unhandled error: ${error.message} - ${error.stack}`)

    if (res.headersSent) {
      return next(error)
    }

    const statusCode = this.getStatusCode(error)
    const message = this.getErrorMessage(error, statusCode)

    res.status(statusCode).json({
      error: message,
      timestamp: new Date().toISOString(),
      path: req.path,
    })
  }

  private static getStatusCode(error: Error): number {
    if (error.message.includes("not found")) return 404
    if (error.message.includes("already exists")) return 409
    if (error.message.includes("Invalid")) return 400
    if (error.message.includes("expired")) return 410
    return 500
  }

  private static getErrorMessage(error: Error, statusCode: number): string {
    if (statusCode >= 500) {
      return "Internal server error"
    }
    return error.message
  }
}

export const errorHandler = ErrorHandler.handle
