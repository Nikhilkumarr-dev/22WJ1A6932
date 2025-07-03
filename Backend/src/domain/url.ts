export interface ShortUrl {
  id?: string
  url: string
  shortcode: string
  validity?: number
  createdAt: Date
  expiresAt: Date
  clickCount: number
}

export interface UrlClick {
  id?: string
  shortcode: string
  timestamp: Date
  sourceIp?: string
  userAgent?: string
  referer?: string
  location?: string
}

export interface UrlStatistics {
  shortcode: string
  totalClicks: number
  createdAt: Date
  expiresAt: Date
  clicks: UrlClick[]
}

export interface CreateUrlRequest {
  url: string
  validity?: number
  shortcode?: string
}

export interface CreateUrlResponse {
  shortlink: string
  expiry: string
}
