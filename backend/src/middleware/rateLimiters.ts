import { RequestHandler } from 'express'
import env from '../config/env'

type RateLimitOptions = {
  windowMs: number
  max: number
  message?: string
  maxUniqueKeys?: number
}

type RateLimitState = {
  count: number
  resetAt: number
}

const createInMemoryRateLimiter = ({ windowMs, max, message, maxUniqueKeys = env.rateLimit.maxUniqueKeys }: RateLimitOptions): RequestHandler => {
  const hits = new Map<string, RateLimitState>()

  const cleanup = () => {
    const now = Date.now()
    for (const [key, value] of hits.entries()) {
      if (value.resetAt <= now) {
        hits.delete(key)
      }
    }
  }

  setInterval(cleanup, windowMs).unref()

  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip || req.socket.remoteAddress || 'anonymous'
    const entry = hits.get(key)

    if (!entry || entry.resetAt <= now) {
      if (!entry && hits.size >= maxUniqueKeys) {
        const oldestKey = hits.keys().next().value
        if (oldestKey) {
          hits.delete(oldestKey)
        }
      }
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > max) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({
        message: message || 'Too many requests. Please try again later.',
      })
    }

    return next()
  }
}

export const generalRateLimiter = createInMemoryRateLimiter({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
})

export const authRateLimiter = createInMemoryRateLimiter({
  windowMs: env.rateLimit.loginWindowMs,
  max: env.rateLimit.loginMax,
  message: 'Too many login attempts. Please try again later.',
})
