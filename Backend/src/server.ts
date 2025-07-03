import App from "./app"
import { Logger } from "../../loggingMiddleware"

const PORT = Number.parseInt(process.env.PORT || "3000")

const app = new App()

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  await Logger.info("server", "SIGTERM received, shutting down gracefully")
  await app.stop()
  process.exit(0)
})

process.on("SIGINT", async () => {
  await Logger.info("server", "SIGINT received, shutting down gracefully")
  await app.stop()
  process.exit(0)
})

process.on("unhandledRejection", async (reason, promise) => {
  await Logger.error("server", `Unhandled Rejection at: ${promise}, reason: ${reason}`)
})

process.on("uncaughtException", async (error) => {
  await Logger.error("server", `Uncaught Exception: ${error.message} - ${error.stack}`)
  process.exit(1)
})

// Start the application
app.start(PORT).catch(async (error) => {
  await Logger.error("server", `Failed to start server: ${error}`)
  process.exit(1)
})
