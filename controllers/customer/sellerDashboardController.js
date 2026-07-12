// controllers/customer/sellerDashboardController.js
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const Category = require("../../models/Category");

// ── My Store Stats ──────────────────────────────────────────────────────────
exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const myProducts = await Product.find({ vendor: sellerId }).populate(
      "category",
      "name",
    );
    const totalProducts = myProducts.length;

    const allOrders = await Order.find({ "products.vendor": sellerId })
      .sort({ createdAt: -1 })
      .populate("products.product", "name imageUrl images price");

    let totalOrders = 0,
      totalEarnings = 0;
    let currentMonthEarnings = 0,
      lastMonthEarnings = 0;
    let currentMonthOrders = 0,
      lastMonthOrders = 0;

    const productSalesMap = {};
    myProducts.forEach((p) => {
      productSalesMap[p._id.toString()] = {
        product: p,
        unitsSold: 0,
        revenue: 0,
      };
    });

    const recentOrders = [];

    allOrders.forEach((order) => {
      const myItems = order.products.filter(
        (p) =>
          p.vendor?.toString() === sellerId &&
          ["paid", "shipped", "delivered"].includes(p.status),
      );
      if (!myItems.length) return;

      totalOrders++;
      const earnings = myItems.reduce((s, p) => s + p.price * p.quantity, 0);
      totalEarnings += earnings;

      const date = new Date(order.createdAt);
      if (date >= startOfThisMonth) {
        currentMonthEarnings += earnings;
        currentMonthOrders++;
      } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
        lastMonthEarnings += earnings;
        lastMonthOrders++;
      }

      myItems.forEach((item) => {
        const pid = item.product?._id?.toString();
        if (pid && productSalesMap[pid]) {
          productSalesMap[pid].unitsSold += item.quantity;
          productSalesMap[pid].revenue += item.price * item.quantity;
        }
      });

      if (recentOrders.length < 5) {
        recentOrders.push({
          _id: order._id,
          createdAt: order.createdAt,
          totalAmount: earnings,
          products: myItems.map((p) => ({
            name: p.product?.name || "Item",
            quantity: p.quantity,
            price: p.price,
            status: p.status,
          })),
        });
      }
    });

    const productPerformance = Object.values(productSalesMap)
      .map(({ product, unitsSold, revenue }) => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        views: product.views || 0,
        isApproved: product.isApproved,
        imageUrl: product.images?.[0]?.url || product.imageUrl || "",
        category: product.category?.name || "General",
        unitsSold,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const avgCategoryPrice = myProducts.length
      ? myProducts.reduce((s, p) => s + p.price, 0) / myProducts.length
      : 0;

    res.json({
      totalProducts,
      totalOrders,
      totalEarnings,
      currentMonthEarnings,
      lastMonthEarnings,
      currentMonthOrders,
      lastMonthOrders,
      productPerformance,
      recentOrders,
      avgCategoryPrice,
    });
  } catch (err) {
    console.error("Seller dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

// ── Marketplace Explorer ────────────────────────────────────────────────────
exports.getMarketplaceExplorer = async (req, res) => {
  try {
    const {
      category = "",
      sort = "best_selling",
      page = 1,
      limit = 12,
    } = req.query;
    const currentPage = parseInt(page) || 1;
    const perPage = parseInt(limit) || 12;

    // Build product query
    const productQuery = { isApproved: true };
    if (category) {
      const cat = await Category.findOne({
        name: new RegExp(`^${category}$`, "i"),
      });
      if (cat) productQuery.category = cat._id;
    }

    const allProducts = await Product.find(productQuery)
      .populate("category", "name")
      .populate("vendor", "name");

    const productIds = allProducts.map((p) => p._id);

    // Aggregate sales data for these products
    const orders = await Order.find({
      "products.product": { $in: productIds },
    });

    const salesMap = {};
    productIds.forEach((id) => {
      salesMap[id.toString()] = { unitsSold: 0, revenue: 0, orderCount: 0 };
    });

    orders.forEach((order) => {
      order.products.forEach((item) => {
        const pid = item.product?.toString();
        if (
          pid &&
          salesMap[pid] &&
          ["paid", "shipped", "delivered"].includes(item.status)
        ) {
          salesMap[pid].unitsSold += item.quantity;
          salesMap[pid].revenue += item.price * item.quantity;
          salesMap[pid].orderCount++;
        }
      });
    });

    // Merge sales into products
    let enriched = allProducts.map((p) => {
      const sales = salesMap[p._id.toString()] || {
        unitsSold: 0,
        revenue: 0,
        orderCount: 0,
      };
      return {
        _id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        views: p.views || 0,
        imageUrl: p.images?.[0]?.url || p.imageUrl || "",
        category: p.category?.name || "General",
        vendor: p.vendor?.name || "Unknown",
        createdAt: p.createdAt,
        ...sales,
      };
    });

    // Sort
    switch (sort) {
      case "best_selling":
        enriched.sort((a, b) => b.unitsSold - a.unitsSold);
        break;
      case "most_viewed":
        enriched.sort((a, b) => b.views - a.views);
        break;
      case "highest_revenue":
        enriched.sort((a, b) => b.revenue - a.revenue);
        break;
      case "newest":
        enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "price_asc":
        enriched.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        enriched.sort((a, b) => b.price - a.price);
        break;
      default:
        enriched.sort((a, b) => b.unitsSold - a.unitsSold);
    }

    const totalCount = enriched.length;
    const totalPages = Math.ceil(totalCount / perPage);
    const paginated = enriched.slice(
      (currentPage - 1) * perPage,
      currentPage * perPage,
    );

    // Category list for filter
    const categories = await Category.find().sort({ name: 1 });

    res.json({ products: paginated, totalPages, totalCount, categories });
  } catch (err) {
    console.error("Marketplace explorer error:", err);
    res.status(500).json({ message: "Failed to load marketplace data" });
  }
};
