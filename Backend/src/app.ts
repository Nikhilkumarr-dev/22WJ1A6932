import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { loggingMiddleware, Logger } from "../../loggingMiddleware"
import { errorHandler } from "./handler/error-handler"
import urlRoutes from "./route/url-routes"
import { Database } from "./db/database"
import { CleanupJob } from "./cron_job/cleanup-job"
import { UrlRepository } from "./repository/url-repository"

class App {
  public app: express.Application
  private database: Database
  private cleanupJob: CleanupJob

  constructor() {
    this.app = express()
    this.database = new Database({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "urlshortener",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
    })

    this.cleanupJob = new CleanupJob(new UrlRepository())

    this.initializeMiddlewares()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet())
    this.app.use(cors())

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
    })
    this.app.use(limiter)

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true }))

    // Custom logging middleware
    this.app.use(loggingMiddleware)
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/health", async (req, res) => {
      await Logger.info("app", "Health check requested")
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: this.database.isConnected() ? "connected" : "disconnected",
      })
    })

    // API routes
    this.app.use("/", urlRoutes)

    // 404 handler
    this.app.use("*", async (req, res) => {
      await Logger.warn("app", `404 - Route not found: ${req.method} ${req.originalUrl}`)
      res.status(404).json({ error: "Route not found" })
    })
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler)
  }

  public async start(port = 3000): Promise<void> {
    try {
      await Logger.info("app", "Starting URL Shortener Microservice")

      // Connect to database
      await this.database.connect()

      // Start cleanup job
      this.cleanupJob.start()

      // Start server
      this.app.listen(port, () => {
        Logger.info("app", `Server is running on port ${port}`)
        Logger.info("app", "URL Shortener Microservice started successfully")
      })
    } catch (error) {
      await Logger.error("app", `Failed to start application: ${error}`)
      process.exit(1)
    }
  }

  public async stop(): Promise<void> {
    try {
      await Logger.info("app", "Shutting down URL Shortener Microservice")

      // Stop cleanup job
      this.cleanupJob.stop()

      // Disconnect from database
      await this.database.disconnect()

      await Logger.info("app", "Application shutdown completed")
    } catch (error) {
      await Logger.error("app", `Error during shutdown: ${error}`)
    }
  }
}

export default App
