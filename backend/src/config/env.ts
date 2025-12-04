import dotenv from 'dotenv'

dotenv.config()

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBool = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  trustProxy: toBool(process.env.TRUST_PROXY),
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || '',
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: toInt(process.env.DB_PORT, 3306),
    maxRetries: toInt(process.env.DB_CONNECT_MAX_RETRIES, 30),
    retryDelayMs: toInt(process.env.DB_CONNECT_RETRY_DELAY_MS, 2000),
  },
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100),
    loginWindowMs: toInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    loginMax: toInt(process.env.LOGIN_RATE_LIMIT_MAX, 10),
    maxUniqueKeys: toInt(process.env.RATE_LIMIT_MAX_KEYS, 2000),
  },
  google: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
  },
  email: {
    host: process.env.IONOS_HOST,
    port: toInt(process.env.IONOS_PORT, 587),
    user: process.env.IONOS_USER,
    pass: process.env.IONOS_PASS,
    from: process.env.IONOS_FROM,
    admin: process.env.ADMIN_EMAIL,
  },
}

const requiredForProduction: Array<[string, string | number | undefined]> = [
  ['JWT_SECRET', env.jwtSecret],
  ['DB_HOST', env.db.host],
  ['DB_USER', env.db.user],
  ['DB_PASSWORD', env.db.password],
  ['DB_NAME', env.db.database],
]

if (env.nodeEnv === 'production') {
  const missing = requiredForProduction.filter(([, value]) => !value)
  if (missing.length) {
    const names = missing.map(([key]) => key).join(', ')
    throw new Error(`Missing required environment variables for production: ${names}`)
  }
}

const warnIfMissing = (name: string, value: string | number | undefined, hint?: string) => {
  if (value) return
  const extra = hint ? ` (${hint})` : ''
  // eslint-disable-next-line no-console
  console.warn(`Warning: ${name} is not set${extra}.`) // Logged early before logger initialization
}

warnIfMissing('JWT_SECRET', env.jwtSecret, 'set a strong secret in production')
warnIfMissing('CORS_ORIGINS', env.corsOrigins.length ? env.corsOrigins.join(',') : undefined)

export { env }
export default env
