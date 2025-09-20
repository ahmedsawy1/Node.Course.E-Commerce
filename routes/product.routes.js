import express from "express";
import { ProductModel } from "../models/product.model.js";
import { handleRouteError } from "../helpers/error-handling.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let newProduct = new ProductModel({
      title: req.body.title,
      price: parseFloat(req.body.price), // "1.6" => 1.6
      category: req.body.category,
      countInStock: parseInt(req.body.countInStock), // "1" => 1
      description: req.body.description,
    });

    newProduct = await newProduct.save();

    return res.status(201).json({
      success: true,
      message: req.t("productCreatedSuccessfully"),
      data: newProduct,
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

export default router;
