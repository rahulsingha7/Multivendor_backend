// middleware/securityMiddleware.js
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const hpp = require("hpp");

// ── 1. Helmet — security headers ─────────────────────────────────────────
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow Cloudinary images
  contentSecurityPolicy: false, // disable CSP to avoid breaking Swagger UI
});

// ── 2. Rate Limiters ──────────────────────────────────────────────────────

// General API limit — 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    message:
      "You have exceeded the request limit. Please try again in 15 minutes.",
  },
});

// Auth limit — 10 requests per 15 minutes (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many attempts",
    message:
      "Too many login/register attempts. Please try again in 15 minutes.",
  },
});

// External API limit — 200 requests per 15 minutes per API key
const externalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers["x-api-key"] || req.ip,
  message: {
    error: "API rate limit exceeded",
    message: "You have exceeded the API request limit. Please slow down.",
  },
});

// ── 3. XSS Protection — sanitizes user input ─────────────────────────────
const xssMiddleware = xss();

// ── 4. HPP — prevents HTTP parameter pollution ───────────────────────────
const hppMiddleware = hpp();

// ── 5. Global Error Handler ───────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);

  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = {
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  externalApiLimiter,
  xssMiddleware,
  hppMiddleware,
  errorHandler,
};
