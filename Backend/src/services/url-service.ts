import type { ShortUrl, UrlClick, UrlStatistics, CreateUrlRequest, CreateUrlResponse } from "../domain/url"
import type { UrlRepository } from "../repository/url-repository"
import { Logger } from "../../../loggingMiddleware"
import { randomBytes } from "crypto"

export class UrlService {
  constructor(private urlRepository: UrlRepository) {}

  async createShortUrl(request: CreateUrlRequest, hostname: string): Promise<CreateUrlResponse> {
    try {
      await Logger.info("service", `Creating short URL for: ${request.url}`)

      // Validate URL format
      if (!this.isValidUrl(request.url)) {
        await Logger.error("service", `Invalid URL format: ${request.url}`)
        throw new Error("Invalid URL format")
      }

      // Generate or validate shortcode
      let shortcode = request.shortcode
      if (shortcode) {
        if (!this.isValidShortcode(shortcode)) {
          await Logger.error("service", `Invalid shortcode format: ${shortcode}`)
          throw new Error("Invalid shortcode format")
        }
        if (await this.urlRepository.shortcodeExists(shortcode)) {
          await Logger.error("service", `Shortcode already exists: ${shortcode}`)
          throw new Error("Shortcode already exists")
        }
      } else {
        shortcode = await this.generateUniqueShortcode()
      }

      // Set validity (default 30 minutes)
      const validity = request.validity || 30
      const createdAt = new Date()
      const expiresAt = new Date(createdAt.getTime() + validity * 60 * 1000)

      const shortUrl: ShortUrl = {
        url: request.url,
        shortcode,
        validity,
        createdAt,
        expiresAt,
        clickCount: 0,
      }

      await this.urlRepository.save(shortUrl)

      const response: CreateUrlResponse = {
        shortlink: `http://${hostname}/shorturls/${shortcode}`,
        expiry: expiresAt.toISOString(),
      }

      await Logger.info("service", `Short URL created successfully: ${shortcode}`)
      return response
    } catch (error) {
      await Logger.error("service", `Failed to create short URL: ${error}`)
      throw error
    }
  }

  async redirectToOriginalUrl(shortcode: string, clientInfo: any): Promise<string> {
    try {
      await Logger.info("service", `Redirect requested for shortcode: ${shortcode}`)

      const shortUrl = await this.urlRepository.findByShortcode(shortcode)
      if (!shortUrl) {
        await Logger.warn("service", `Shortcode not found: ${shortcode}`)
        throw new Error("Shortcode not found")
      }

      // Check if URL has expired
      if (new Date() > shortUrl.expiresAt) {
        await Logger.warn("service", `Expired shortcode accessed: ${shortcode}`)
        throw new Error("Short URL has expired")
      }

      // Record click
      const click: UrlClick = {
        shortcode,
        timestamp: new Date(),
        sourceIp: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        referer: clientInfo.referer,
      }

      await this.urlRepository.saveClick(click)
      await this.urlRepository.incrementClickCount(shortcode)

      await Logger.info("service", `Successful redirect for shortcode: ${shortcode} to ${shortUrl.url}`)
      return shortUrl.url
    } catch (error) {
      await Logger.error("service", `Failed to redirect: ${error}`)
      throw error
    }
  }

  async getUrlStatistics(shortcode: string): Promise<UrlStatistics> {
    try {
      await Logger.info("service", `Statistics requested for shortcode: ${shortcode}`)

      const statistics = await this.urlRepository.getStatistics(shortcode)
      if (!statistics) {
        await Logger.warn("service", `Statistics not found for shortcode: ${shortcode}`)
        throw new Error("Shortcode not found")
      }

      await Logger.info("service", `Statistics retrieved for shortcode: ${shortcode}`)
      return statistics
    } catch (error) {
      await Logger.error("service", `Failed to get statistics: ${error}`)
      throw error
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private isValidShortcode(shortcode: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(shortcode) && shortcode.length >= 4 && shortcode.length <= 20
  }

  private async generateUniqueShortcode(): Promise<string> {
    let shortcode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      shortcode = randomBytes(4).toString("hex").substring(0, 6)
      attempts++

      if (attempts >= maxAttempts) {
        throw new Error("Unable to generate unique shortcode")
      }
    } while (await this.urlRepository.shortcodeExists(shortcode))

    return shortcode
  }
}
