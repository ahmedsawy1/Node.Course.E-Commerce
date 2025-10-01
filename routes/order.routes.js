import express from "express";
import { OrderModel } from "../models/order.model.js";
import { ProductModel } from "../models/product.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import {
  adminOnly,
  userAndAdmin,
  userOnly,
} from "../middleware/roles.middleware.js";
import mongoose from "mongoose";
import { orderStatuses } from "../constants/order.constants.js";

const router = express.Router();

router.post("/", userAndAdmin, async (req, res) => {
  try {
    const { orderItems } = req.body;
    const { auth: currentUser } = req;

    // Validate order items
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        message: req.t("orderItemsRequired"),
      });
    }

    for (const item of orderItems) {
      // validate product and qty existence
      if (!item.product || !item.quantity) {
        return res.status(400).send({
          message: req.t("orderItemValidation"),
        });
      }

      // validate if product id is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).send({
          message: req.t("invalidProductId"),
          invalidId: item.product,
        });
      }

      // validate if product quantity is not a valid quantity
      if (typeof item.quantity !== "number" || item.quantity < 1) {
        return res.status(400).send({
          message: req.t("quantityMustBeAtLeast1"),
        });
      }

      // 1.5
      // validate that quantity is a whole number ( no decimal )
      if (!Number.isInteger(item.quantity)) {
        return res.status(400).send({
          message: req.t("quantityMustBeWholeNumber"),
          invalidQuantity: item.quantity,
        });
      }
    }

    // Verify if product IDs exist in DB or not
    const productIds = orderItems.map((item) => item.product);

    const products = await ProductModel.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(404).send({
        message: req.t("productsNotFound"),
      });
    }

    const orderItemsWithPrices = [];

    for (const item of orderItems) {
      // Find the product
      const product = products.find((p) => p._id.toString() === item.product);

      if (product.countInStock < item.quantity) {
        return res.status(400).send({
          message: req.t("insufficientStock"),
          productName: product.title,
          availableStock: product.countInStock,
          requestedQuantity: item.quantity,
        });
      }

      orderItemsWithPrices.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price, // from DB
      });
    }

    const totalPrice = orderItemsWithPrices.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    const newOrder = new OrderModel({
      orderItems: orderItemsWithPrices,
      user: currentUser.id,
      totalPrice,
    });

    const savedOrder = await newOrder.save();

    // Update product stock
    for (const item of orderItemsWithPrices) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.quantity },
      });
    }

    const populatedOrder = await OrderModel.findById(savedOrder._id)
      .populate(
        "user",
        "userName email phoneNumber city postalCode addressLine1 addressLine2"
      )
      .populate(
        "orderItems.product",
        "title price images countInStock rating views"
      );

    res.status(201).send({
      message: req.t("orderCreatedSuccessfully"),
      data: populatedOrder,
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

router.get("/", async (req, res) => {
  try {
    const { auth: currentUser } = req;
    const isAdmin = currentUser === "admin";

    // Pagination Params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // search param
    const search = req.query.search || "";

    const filter = {};

    if (!isAdmin) {
      filter.user = currentUser.id;
    }

    if (search) {
      filter.$or = [{ status: { $regex: search, $options: "i" } }];
    }

    const skip = (page - 1) * limit;

    const totalOrders = await OrderModel.countDocuments(filter);

    const orderList = await OrderModel.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalOrders / limit);

    res.send({
      data: orderList,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filter: {
        search,
      },
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

router.get("/:id", userAndAdmin, async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
      .populate(
        "user",
        "userName email phoneNumber city postalCode addressLine1 addressLine2"
      )
      .populate(
        "orderItems.product",
        "title price images countInStock rating views"
      );

    if (!order) {
      return res.status(404).send({ message: req.t("orderNotFound") });
    }

    const { auth: currentUser } = req;

    if (
      currentUser.role !== "admin" &&
      currentUser.id.toString() !== order.user._id.toString()
    ) {
      return res.status(403).send({
        message: req.t("accessDeniedOwnOrdersOnly"),
      });
    }

    res.send(order);
  } catch (error) {
    handleRouteError(error, res);
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    const order = await OrderModel.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).send({ message: req.t("orderNotFound") });
    }

    res.send({
      message: req.t("orderDeletedSuccessfully"),
      data: order,
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

router.patch("/:id/change-status", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).send({
        message: req.t("statusRequired"),
      });
    }

    if (!orderStatuses.includes(status)) {
      return res.status(400).send({
        message: req.t("invalidStatus"),
      });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send({ message: req.t("orderNotFound") });
    }

    res.send({
      message: req.t("orderStatusUpdatedSuccessfully"),
      data: updatedOrder,
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

// Users only
// Validate that the order exists in the database
// Verify that the order belongs to the currently logged-in user
// Prevent modifications if the order has already been delivered or shipped
// Increment the product quantity.


router.patch("/:id/cancel-order", userOnly, async (req, res) => {
  try {
    const { auth: currentUser } = req;
    const orderId = req.params.id;

    // Find the order
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).send({
        message: req.t("orderNotFound"),
      });
    }

    // Check if the order belongs to the current user
    if (order.user.toString() !== currentUser.id.toString()) {
      return res.status(403).send({
        message: req.t("accessDeniedOwnOrdersOnly"),
      });
    }

    // Check if order can be cancelled (only pending and processing orders can be cancelled)
    if (order.status === "cancelled") {
      return res.status(400).send({
        message: req.t("orderAlreadyCancelled"),
      });
    }

    if (order.status === "shipped" || order.status === "delivered") {
      return res.status(400).send({
        message: req.t("cannotCancelShippedOrDeliveredOrder"),
      });
    }

    // Update order status to cancelled
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { status: "cancelled" },
      { new: true }
    )

    // Restore product stock
    for (const item of order.orderItems) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { countInStock: item.quantity },
      });
    }

    res.send({
      message: req.t("orderCancelledSuccessfully"),
      data: updatedOrder,
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

export default router;
