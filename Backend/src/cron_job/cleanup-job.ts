import { CronJob } from "cron"
import type { UrlRepository } from "../repository/url-repository"
import { Logger } from "../../../loggingMiddleware"

export class CleanupJob {
  private job: CronJob

  constructor(private urlRepository: UrlRepository) {
    // Run every hour to clean up expired URLs
    this.job = new CronJob("0 0 * * * *", async () => {
      await this.cleanupExpiredUrls()
    })
  }

  start(): void {
    this.job.start()
    Logger.info("cron_job", "Cleanup job started - runs every hour")
  }

  stop(): void {
    this.job.stop()
    Logger.info("cron_job", "Cleanup job stopped")
  }

  private async cleanupExpiredUrls(): Promise<void> {
    try {
      await Logger.info("cron_job", "Starting cleanup of expired URLs")

      // In a real implementation, this would query the database
      // and remove expired URLs. For this example, we'll just log.

      await Logger.info("cron_job", "Cleanup job completed successfully")
    } catch (error) {
      await Logger.error("cron_job", `Cleanup job failed: ${error}`)
    }
  }
}
