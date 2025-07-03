import type { Request, Response } from "express"
import type { UrlService } from "../service/url-service"
import { Logger } from "../../../loggingMiddleware"

export class UrlController {
  constructor(private urlService: UrlService) {}

  async createShortUrl(req: Request, res: Response): Promise<void> {
    try {
      await Logger.info("controller", "POST /shorturls - Create short URL request received")

      const { url, validity, shortcode } = req.body

      if (!url) {
        await Logger.error("controller", "Missing required field: url")
        res.status(400).json({ error: "URL is required" })
        return
      }

      const hostname = req.get("host") || "localhost:3000"
      const result = await this.urlService.createShortUrl({ url, validity, shortcode }, hostname)

      await Logger.info("controller", `Short URL created successfully: ${result.shortlink}`)
      res.status(201).json(result)
    } catch (error) {
      await Logger.error("controller", `Create short URL failed: ${error}`)

      if (error instanceof Error) {
        if (error.message.includes("Invalid URL") || error.message.includes("Invalid shortcode")) {
          res.status(400).json({ error: error.message })
        } else if (error.message.includes("already exists")) {
          res.status(409).json({ error: error.message })
        } else {
          res.status(500).json({ error: "Internal server error" })
        }
      } else {
        res.status(500).json({ error: "Internal server error" })
      }
    }
  }

  async redirectToUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortcode } = req.params
      await Logger.info("controller", `GET /shorturls/${shortcode} - Redirect request received`)

      const clientInfo = {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        referer: req.get("Referer"),
      }

      const originalUrl = await this.urlService.redirectToOriginalUrl(shortcode, clientInfo)

      await Logger.info("controller", `Redirecting to: ${originalUrl}`)
      res.redirect(302, originalUrl)
    } catch (error) {
      await Logger.error("controller", `Redirect failed: ${error}`)

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          res.status(404).json({ error: "Short URL not found" })
        } else if (error.message.includes("expired")) {
          res.status(410).json({ error: "Short URL has expired" })
        } else {
          res.status(500).json({ error: "Internal server error" })
        }
      } else {
        res.status(500).json({ error: "Internal server error" })
      }
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { shortcode } = req.params
      await Logger.info("controller", `GET /shorturls/${shortcode}/stats - Statistics request received`)

      const statistics = await this.urlService.getUrlStatistics(shortcode)

      await Logger.info("controller", `Statistics retrieved for: ${shortcode}`)
      res.json(statistics)
    } catch (error) {
      await Logger.error("controller", `Get statistics failed: ${error}`)

      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: "Short URL not found" })
      } else {
        res.status(500).json({ error: "Internal server error" })
      }
    }
  }
}
