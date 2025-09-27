import express from "express";
import { OrderModel } from "../models/order.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import { userAndAdmin } from "../middleware/roles.middleware.js";
import mongoose from "mongoose";

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

    res.send("No Validation Errors")
  } catch (error) {
    handleRouteError(error, res);
  }
});

export default router;
