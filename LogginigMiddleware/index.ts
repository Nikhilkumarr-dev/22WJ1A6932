import axios from "axios"

interface LogParams {
  stack: string
  level: string
  package: string
  message: string
}

export class Logger {
  private static readonly LOG_API_URL = "http://20.244.56.144/evaluation-service/logs"

  static async Log(stack: string, level: string, packageName: string, message: string): Promise<void> {
    try {
      const logData: LogParams = {
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: packageName.toLowerCase(),
        message,
      }

      await axios.post(this.LOG_API_URL, logData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("Failed to send log to external service:", error)
    }
  }

  static async info(packageName: string, message: string): Promise<void> {
    await this.Log("backend", "info", packageName, message)
  }

  static async error(packageName: string, message: string): Promise<void> {
    await this.Log("backend", "error", packageName, message)
  }

  static async warn(packageName: string, message: string): Promise<void> {
    await this.Log("backend", "warn", packageName, message)
  }

  static async debug(packageName: string, message: string): Promise<void> {
    await this.Log("backend", "debug", packageName, message)
  }
}

export const loggingMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now()

  Logger.info("middleware", `${req.method} ${req.path} - Request started`)

  res.on("finish", () => {
    const duration = Date.now() - start
    Logger.info("middleware", `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
  })

  next()
}
