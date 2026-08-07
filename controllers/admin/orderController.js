const Order = require("../../models/Order");

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, search = "", status = "", category = "" } = req.query;
    const limit = 10;
    const skip = (parseInt(page) - 1) * limit;

    const matchStage = {};

    if (search) {
      matchStage.$or = [{ phone: { $regex: search, $options: "i" } }];
    }

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

    if (status) {
      pipeline.push({
        $match: {
          "products.status": status,
        },
      });
    }

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
      { $limit: limit },
    );

    const orders = await Order.aggregate(pipeline);

    const totalCountPipeline = pipeline.filter(
      (stage) => !stage.$skip && !stage.$limit,
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
