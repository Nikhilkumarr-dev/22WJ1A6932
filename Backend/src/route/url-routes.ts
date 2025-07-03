import { Router } from "express"
import { UrlController } from "../controller/url-controller"
import { UrlService } from "../service/url-service"
import { UrlRepository } from "../repository/url-repository"

const router = Router()

// Initialize dependencies
const urlRepository = new UrlRepository()
const urlService = new UrlService(urlRepository)
const urlController = new UrlController(urlService)

// Routes
router.post("/shorturls", (req, res) => urlController.createShortUrl(req, res))
router.get("/shorturls/:shortcode", (req, res) => urlController.redirectToUrl(req, res))
router.get("/shorturls/:shortcode/stats", (req, res) => urlController.getStatistics(req, res))

export default router
