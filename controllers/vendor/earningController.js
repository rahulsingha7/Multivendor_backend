const Order = require("../../models/Order");

exports.getVendorEarnings = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    const orders = await Order.find({ "products.vendor": vendorId });

    let totalEarnings = 0;
    let totalOrders = 0;

    orders.forEach((order) => {
      const vendorProducts = order.products.filter(
        (item) =>
          item.vendor.toString() === vendorId &&
          ["paid", "shipped", "delivered"].includes(item.status)
      );

      const vendorTotal = vendorProducts.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      totalEarnings += vendorTotal;
      if (vendorProducts.length > 0) totalOrders++;
    });

    res.json({ totalEarnings, totalOrders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch earnings" });
  }
};

exports.getVendorDetailedEarnings = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const orders = await Order.find({
      "products.vendor": vendorId,
    }).populate("products.product", "name");

    const now = new Date();
    const latestMonths = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      latestMonths.push(key);
    }

    const monthlyEarnings = {};
    const productEarnings = {};
    const monthlyProductEarnings = {}; // For monthly filtered product earnings

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${String(
        orderDate.getMonth() + 1
      ).padStart(2, "0")}`;

      order.products.forEach((item) => {
        if (
          item.vendor.toString() === vendorId &&
          ["paid", "shipped", "delivered"].includes(item.status)
        ) {
          const earning = item.price * item.quantity;
          const productName = item.product?.name || "Unknown";

          // Monthly earnings (last 12 months)
          if (latestMonths.includes(monthKey)) {
            monthlyEarnings[monthKey] =
              (monthlyEarnings[monthKey] || 0) + earning;

            // Monthly product earnings
            if (!monthlyProductEarnings[monthKey]) {
              monthlyProductEarnings[monthKey] = {};
            }
            monthlyProductEarnings[monthKey][productName] =
              (monthlyProductEarnings[monthKey][productName] || 0) + earning;
          }

          // Overall product earnings (all time)
          productEarnings[productName] =
            (productEarnings[productName] || 0) + earning;
        }
      });
    });

    // Fill missing months with zero earnings
    const finalMonthlyEarnings = {};
    latestMonths.forEach((m) => {
      finalMonthlyEarnings[m] = monthlyEarnings[m] || 0;
    });

    res.json({
      monthlyEarnings: finalMonthlyEarnings,
      productEarnings,
      monthlyProductEarnings,
    });
  } catch (err) {
    console.error("Error in detailed earnings:", err);
    res.status(500).json({ message: "Failed to fetch detailed earnings" });
  }
};
