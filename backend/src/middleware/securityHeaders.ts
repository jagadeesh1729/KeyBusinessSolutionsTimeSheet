import { RequestHandler } from 'express'
import env from '../config/env'

const buildCsp = (allowedOrigins: string[]): string => {
  const connect = allowedOrigins.length ? allowedOrigins.join(' ') : ''
  const directives = [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "img-src 'self' data: https://source.unsplash.com",
    `connect-src 'self' ${connect}`.trim(),
    "font-src 'self' https://fonts.gstatic.com data:",
    "frame-ancestors 'none'",
  ]

  return directives.join('; ')
}

export const securityHeaders: RequestHandler = (req, res, next) => {
  const allowedOrigins = env.corsOrigins.length ? env.corsOrigins : []

  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')

  const csp = buildCsp(allowedOrigins)
  res.setHeader('Content-Security-Policy', csp)

  next()
}
