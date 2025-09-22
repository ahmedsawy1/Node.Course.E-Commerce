import express from "express";
import { ProductModel } from "../models/product.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import { getFileURL } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", uploadMultiple, async (req, res) => {
  try {

    let imageURLs = []
    if(req.files && req.files.length > 0) {
      imageURLs = req.files.map((file) => getFileURL(req, file.filename))
    }
    
    let newProduct = new ProductModel({
      title: req.body.title,
      price: parseFloat(req.body.price), // "1.6" => 1.6
      category: req.body.category,
      countInStock: parseInt(req.body.countInStock), // "1" => 1
      description: req.body.description,
      images: imageURLs
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
