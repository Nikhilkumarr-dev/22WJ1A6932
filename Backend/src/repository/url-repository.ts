import type { ShortUrl, UrlClick, UrlStatistics } from "../domain/url"
import { Logger } from "../../../loggingMiddleware"

export class UrlRepository {
  private urls: Map<string, ShortUrl> = new Map()
  private clicks: Map<string, UrlClick[]> = new Map()

  async save(url: ShortUrl): Promise<ShortUrl> {
    try {
      this.urls.set(url.shortcode, url)
      await Logger.info("repository", `URL saved with shortcode: ${url.shortcode}`)
      return url
    } catch (error) {
      await Logger.error("repository", `Failed to save URL: ${error}`)
      throw error
    }
  }

  async findByShortcode(shortcode: string): Promise<ShortUrl | null> {
    try {
      const url = this.urls.get(shortcode) || null
      await Logger.info("repository", `URL lookup for shortcode: ${shortcode} - ${url ? "found" : "not found"}`)
      return url
    } catch (error) {
      await Logger.error("repository", `Failed to find URL by shortcode: ${error}`)
      throw error
    }
  }

  async incrementClickCount(shortcode: string): Promise<void> {
    try {
      const url = this.urls.get(shortcode)
      if (url) {
        url.clickCount++
        this.urls.set(shortcode, url)
        await Logger.info("repository", `Click count incremented for shortcode: ${shortcode}`)
      }
    } catch (error) {
      await Logger.error("repository", `Failed to increment click count: ${error}`)
      throw error
    }
  }

  async saveClick(click: UrlClick): Promise<void> {
    try {
      const existingClicks = this.clicks.get(click.shortcode) || []
      existingClicks.push(click)
      this.clicks.set(click.shortcode, existingClicks)
      await Logger.info("repository", `Click recorded for shortcode: ${click.shortcode}`)
    } catch (error) {
      await Logger.error("repository", `Failed to save click: ${error}`)
      throw error
    }
  }

  async getStatistics(shortcode: string): Promise<UrlStatistics | null> {
    try {
      const url = this.urls.get(shortcode)
      if (!url) {
        await Logger.warn("repository", `Statistics requested for non-existent shortcode: ${shortcode}`)
        return null
      }

      const clicks = this.clicks.get(shortcode) || []
      const statistics: UrlStatistics = {
        shortcode: url.shortcode,
        totalClicks: url.clickCount,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        clicks,
      }

      await Logger.info("repository", `Statistics retrieved for shortcode: ${shortcode}`)
      return statistics
    } catch (error) {
      await Logger.error("repository", `Failed to get statistics: ${error}`)
      throw error
    }
  }

  async shortcodeExists(shortcode: string): Promise<boolean> {
    return this.urls.has(shortcode)
  }
}
