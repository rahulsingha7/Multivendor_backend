const Order = require("../../models/Order");

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, search = "", status = "", category = "" } = req.query;
    const limit = 10;
    const skip = (parseInt(page) - 1) * limit;

    // Build base query
    const matchStage = {};

    // Search by customer name/email and phone
    if (search) {
      matchStage.$or = [{ phone: { $regex: search, $options: "i" } }];
    }

    // Use aggregation to join and filter properly
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
    ];

    // Add customer name/email search
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "customer.name": { $regex: search, $options: "i" } },
            { "customer.email": { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add status filtering
    if (status) {
      pipeline.push({
        $match: {
          "products.status": status,
        },
      });
    }

    // Add category filtering
    if (category) {
      pipeline.push({
        $match: {
          "products.product.category": category,
        },
      });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const orders = await Order.aggregate(pipeline);

    // Total count (for pagination)
    const totalCountPipeline = pipeline.filter(
      (stage) => !stage.$skip && !stage.$limit
    );
    totalCountPipeline.push({ $count: "total" });
    const countResult = await Order.aggregate(totalCountPipeline);
    const total = countResult[0]?.total || 0;

    res.json({
      orders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
