# 🛒 Multivendor Shop Backend

This is the backend of a full-stack multivendor e-commerce platform built using **Express.js**, **MongoDB**, and **Stripe**. It handles authentication, vendor management, product listings, order processing, payments, admin moderation, and customer support.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based login/register system
- Password strength validation (min 8 characters, letter + number required)
- Google Sign-In via Firebase
- Role-based access: `customer`, `vendor`, `admin`
- Protected routes for each role

### 🛍 Vendor Dashboard
- Create, update, delete products
- Upload product images via **Cloudinary**
- AI-generated product descriptions (Claude API)
- View vendor-specific orders
- Earnings tracking

### 🛒 Customer Experience
- Browse products with category & search filters
- Add items to cart (stored in frontend context/localStorage)
- Checkout flow with Stripe payment (cards, Apple Pay, Google Pay)
- Coupon/discount code support
- Submit/edit/delete product reviews
- View past orders with real-time status tracking
- Live chat support widget (Gemini-powered FAQ assistant)

### 🧑‍💼 Admin Panel
- Approve or reject vendor requests
- Moderate product listings
- Manage coupons
- View all orders and users
- API key & webhook management for external integrations

### 💬 AI Support Chatbot
- Floating chat widget on every page
- Powered by Google's Gemini API, with a rule-based fallback if the API is unavailable
- Answers questions about shipping, orders, payments, vendor signup, and coupons

---

## 🧰 Technologies Used

| Tech              | Purpose                                  |
|-------------------|-------------------------------------------|
| **Express.js**    | Server framework                          |
| **MongoDB + Mongoose** | Database                             |
| **jsonwebtoken**  | JWT-based session management              |
| **bcryptjs**      | Password hashing                          |
| **multer**        | File upload handling                      |
| **cloudinary**    | Hosting uploaded product images           |
| **nodemailer**    | Sending transactional emails              |
| **stripe**        | Payment gateway (cards, Apple Pay, Google Pay) |
| **firebase-admin**| Google Sign-In verification               |
| **Gemini API**    | AI-powered support chatbot                |
| **cookie-parser**, **cors**, **dotenv** | Server utilities       |

---

## ⚙️ Environment Variables

Create a `.env` file in the root with:

PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-flash-latest

CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

FIREBASE_ADMIN_JSON=your_firebase_service_account_json


---

## 🔌 API Endpoints Overview

### 🔑 Auth
- `POST /api/auth/register` – Register as customer or vendor (with email verification + password strength check)
- `POST /api/auth/login` – Login and receive JWT
- `POST /api/auth/google` – Google Sign-In via Firebase
- `POST /api/auth/forgot-password` – Request password reset link
- `POST /api/auth/reset-password/:token` – Reset password

---

### 👤 Customer Routes
- `GET /api/customer/orders` – Get logged-in customer's orders
- `POST /api/customer/reviews` – Create a review (protected)
- `PUT /api/customer/reviews/:id` – Edit a review (protected)
- `DELETE /api/customer/reviews/:id` – Delete a review (protected)
- `POST /api/customer/coupons/validate` – Validate and apply a coupon code

---

### 🛍 Public Product & Category
- `GET /api/products/public` – List all public products
- `GET /api/products/public/:id` – Get a product by ID
- `GET /api/categories` – Fetch all product categories

---

### ⭐ Public Reviews
- `GET /api/reviews/public?limit=4` – Get latest public reviews
- `GET /api/reviews/public` – Paginated all reviews (e.g. for /reviews page)

---

### 🧾 Checkout & Payment (Stripe)
- `POST /api/payment/create-checkout-session` – Create Stripe checkout session (cards, Apple Pay, Google Pay)
- `POST /webhook` – Stripe webhook listener (⚠️ requires raw body)

---

### 💬 Chatbot
- `POST /api/chat/message` – Send a message to the support chatbot

---

### 👨‍🍳 Vendor Dashboard
- `POST /api/vendor/products` – Create product (image uploads via Cloudinary)
- `GET /api/vendor/products` – Get vendor's own products
- `PUT /api/vendor/products/:id` – Update product
- `DELETE /api/vendor/products/:id` – Delete product

- `GET /api/vendor/orders` – Get orders relevant to the vendor
- `GET /api/vendor/earnings` – Get total earnings
- `GET /api/vendor/dashboard` – Summary of vendor activity

---

### 🧑‍💼 Admin Panel
- `GET /api/admin/vendors` – View or moderate vendor accounts
- `GET /api/admin/products` – View or moderate products
- `GET /api/admin/orders` – View all orders
- `GET /api/admin/users` – View all users
- `GET /api/admin/dashboard` – Admin stats & analytics
- `GET /api/admin/coupons` – Manage coupons
- `GET /api/admin/api-keys` – Manage API keys & webhooks for external integrations

---

## 📬 Nodemailer Integration

We use `nodemailer` to send verification and password-reset emails.

### 📌 Use Cases

- ✅ Sends a verification email with a secure activation link after user signup.
- 🔑 Sends a password reset link when requested.
- 📥 Ensures only valid email addresses can register.

---

## ☁️ Cloudinary Integration

- Product images are uploaded and stored via **Cloudinary**
- Accessible URLs are saved in the DB

---

## 💳 Stripe Payment Integration

- Checkout powered by **Stripe Checkout**
- Supports cards, Apple Pay, and Google Pay
- Webhooks listen for payment success (`checkout.session.completed`)

To test webhooks locally:

```bash
stripe listen --forward-to localhost:5000/webhook
```

---

## 🤖 AI Chatbot Integration

- Powered by **Google's Gemini API** (free tier)
- Falls back to a rule-based FAQ matcher if the API is unavailable or rate-limited
- Answers questions about shipping, orders, payments, vendor signup, and coupons

---

## 📦 Scripts

```bash
# Start in development mode
npm run dev

# Start in production mode
npm start
```
