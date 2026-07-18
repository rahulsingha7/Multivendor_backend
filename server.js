const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────
const {
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  externalApiLimiter,
  xssMiddleware,
  hppMiddleware,
  errorHandler,
} = require("./middleware/securityMiddleware");

// 1. Helmet — security headers
app.use(helmetMiddleware);

// 2. CORS — restrict to your domain only
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
);

// 3. HPP — prevent HTTP parameter pollution
app.use(hppMiddleware);

//  Stripe webhook must be BEFORE json middleware
const webhookRoutes = require("./routes/customer/webhookRoutes");
app.use("/webhook", bodyParser.raw({ type: "application/json" }));
app.use("/webhook", webhookRoutes);

//  General JSON parsers (after webhook)
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

// 4. XSS — sanitize all user input
app.use(xssMiddleware);

// 5. Rate limiting
// Rate limiting — applied selectively
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/external", externalApiLimiter);
app.use("/api/", generalLimiter);

//  All other route imports
const authRoutes = require("./routes/auth");
const vendorRoutes = require("./routes/vendor/vendorRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const customerRoutes = require("./routes/customer/customerRoutes");
const vendorProductRoutes = require("./routes/vendor/productRoutes");
const vendorOrderRoutes = require("./routes/vendor/orderRoutes");
const vendorEarningRoutes = require("./routes/vendor/earningRoutes");
const vendorDashboardRoutes = require("./routes/vendor/dashboardRoutes");
const categoryRoutes = require("./routes/public/categoryRoutes");
const publicProductRoutes = require("./routes/public/productRoutes");
const publicReviewRoutes = require("./routes/public/reviewRoutes");
const newsletterRoutes = require("./routes/public/newsletterRoutes");
const customerOrderRoutes = require("./routes/customer/orderRoutes");
const customerReviewRoutes = require("./routes/customer/reviewRoutes");
const paymentRoutes = require("./routes/customer/paymentRoutes");
const adminVendorRoutes = require("./routes/admin/vendorRoutes");
const adminProductRoutes = require("./routes/admin/productRoutes");
const adminOrderRoutes = require("./routes/admin/orderRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");
const adminDashboardRoutes = require("./routes/admin/dashboardRoutes");
const adminCouponRoutes = require("./routes/admin/couponRoutes");
const customerCouponRoutes = require("./routes/customer/couponRoutes");
const wishlistRoutes = require("./routes/customer/wishlistRoutes");
const customerProductRoutes = require("./routes/customer/productRoutes");
const apiKeyRoutes = require("./routes/admin/apiKeyRoutes");
const externalApiRoutes = require("./routes/public/externalApiRoutes");

// ✅ Use all API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", publicReviewRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/customer/reviews", customerReviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/products/public", publicProductRoutes);
app.use("/api/vendor/products", vendorProductRoutes);
app.use("/api/vendor/orders", vendorOrderRoutes);
app.use("/api/vendor/earnings", vendorEarningRoutes);
app.use("/api/vendor/dashboard", vendorDashboardRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/admin/vendors", adminVendorRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/api-keys", apiKeyRoutes);
app.use("/api/customer/coupons", customerCouponRoutes);
app.use("/api/customer/wishlist", wishlistRoutes);
app.use("/api/customer/products", customerProductRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);

// ── Shopify-style API Platform ───────────────────────────────────────────
app.use("/api/external", externalApiRoutes);

// ── Swagger API Docs ─────────────────────────────────────────────────────
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./utils/swagger");
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customSiteTitle: "MultiVendor API Docs",
    customfavIcon: "",
    swaggerOptions: { persistAuthorization: true },
  }),
);

//  Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

//  MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Failed:", err));

//  Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));