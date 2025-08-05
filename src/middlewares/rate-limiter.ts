// src/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
});
