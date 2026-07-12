// utils/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MultiVendor Shop API",
      version: "1.0.0",
      description: `
## Welcome to the MultiVendor Shop API

This API allows you to integrate MultiVendor Shop data into your own applications.

### Authentication
All external API endpoints require an API key. Include it in every request:

\`\`\`
X-API-Key: mv_live_your_key_here
\`\`\`

Or as a Bearer token:
\`\`\`
Authorization: Bearer mv_live_your_key_here
\`\`\`

### Getting an API Key
Contact the platform administrator to get your API key.

### Webhooks
You can register webhook URLs to receive real-time notifications when events happen on the platform.
Contact the administrator to set up webhooks for your API key.

### Available Events
- \`order.created\` — A new order was placed
- \`order.shipped\` — An order was marked as shipped
- \`order.delivered\` — An order was marked as delivered
- \`order.cancelled\` — An order was cancelled
- \`product.approved\` — A product was approved by admin
- \`vendor.approved\` — A vendor was approved by admin
      `,
      contact: {
        email: process.env.EMAIL_USER || "support@multivendor.shop",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Your API key (mv_live_xxx)",
        },
      },
      schemas: {
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            stock: { type: "number" },
            imageUrl: { type: "string" },
            category: {
              type: "object",
              properties: { name: { type: "string" } },
            },
            views: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            customer: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            totalAmount: { type: "number" },
            address: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
          },
        },
      },
    },
    security: [{ ApiKeyHeader: [] }],
    tags: [
      { name: "Products", description: "Browse approved products" },
      { name: "Categories", description: "Product categories" },
      {
        name: "Orders",
        description: "Order data (requires orders:read permission)",
      },
      { name: "Reviews", description: "Product reviews" },
      { name: "Stats", description: "Platform statistics" },
    ],
    paths: {
      "/api/external/stats": {
        get: {
          tags: ["Stats"],
          summary: "Get platform statistics",
          description:
            "Returns total products, orders, vendors, customers and revenue",
          responses: {
            200: {
              description: "Platform stats",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      stats: {
                        type: "object",
                        properties: {
                          totalProducts: { type: "number" },
                          totalOrders: { type: "number" },
                          totalVendors: { type: "number" },
                          totalCustomers: { type: "number" },
                          totalRevenue: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: "Invalid or missing API key" },
          },
        },
      },
      "/api/external/products": {
        get: {
          tags: ["Products"],
          summary: "Get all products",
          description: "Returns paginated list of all approved products",
          parameters: [
            {
              name: "category",
              in: "query",
              schema: { type: "string" },
              description: "Filter by category name",
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Search by product name",
            },
            {
              name: "sort",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "newest",
                  "oldest",
                  "price_asc",
                  "price_desc",
                  "most_viewed",
                ],
              },
              description: "Sort order",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            200: { description: "List of products" },
            401: { description: "Invalid or missing API key" },
            403: { description: "Missing products:read permission" },
          },
        },
      },
      "/api/external/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Get a single product",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Product details" },
            404: { description: "Product not found" },
          },
        },
      },
      "/api/external/categories": {
        get: {
          tags: ["Categories"],
          summary: "Get all categories",
          responses: { 200: { description: "List of categories" } },
        },
      },
      "/api/external/orders": {
        get: {
          tags: ["Orders"],
          summary: "Get all orders",
          description: "Requires orders:read permission",
          parameters: [
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["paid", "shipped", "delivered", "cancelled"],
              },
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            200: { description: "List of orders" },
            403: { description: "Missing orders:read permission" },
          },
        },
      },
      "/api/external/reviews": {
        get: {
          tags: ["Reviews"],
          summary: "Get product reviews",
          parameters: [
            {
              name: "productId",
              in: "query",
              schema: { type: "string" },
              description: "Filter by product ID",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: { 200: { description: "List of reviews" } },
        },
      },
    },
  },
  apis: [],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
